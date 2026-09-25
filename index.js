/**
 * Host half of the MIMO quota bundle.
 * - Reads token usage from the persisted session event logs (.jsonl.zstd):
 *   one record per model call with real timestamps, rebuilt at start and
 *   extended live through the session/event watermark.
 * - Persists records into the profile directory (JSON) with debounced saves.
 * - Serves aggregated stats to the Client panel via GET /api/mimo.quota.
 */
import { existsSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { zstdDecompressSync } from 'node:zlib';

export const inject = ['connection'];

const MAX_RECORDS = 20000;
const SAVE_DELAY = 800;
const DEFAULT_CURRENCY = '¥';

/** Domestic list prices, CNY per 1M tokens (official pay-as-you-go page). */
const DEFAULT_PRICING = {
  default: { input: 3, hit: 0.025, output: 6, cw: 0 },
  models: {
    'mimo-v2.6-pro': { input: 3, hit: 0.025, output: 6, cw: 0 },
    'mimo-v2.5-pro': { input: 3, hit: 0.025, output: 6, cw: 0 },
    'mimo-v2.6-flash': { input: 1, hit: 0.02, output: 2, cw: 0 },
    'mimo-v2.5': { input: 1, hit: 0.02, output: 2, cw: 0 },
    'mimo-v2.6-pro-ultraspeed': { input: 30, hit: 0.25, output: 60, cw: 0 },
    'mimo-v2.5-tts': { input: 0, hit: 0, output: 0, cw: 0 },
  },
};

/**
 * Built-in DeepSeek time-of-day tiers (CNY per 1M tokens). Peak = Beijing
 * 09:00-12:00 and 14:00-18:00 on weekdays; all other hours and weekends are
 * off-peak — same schedule as the token-usage-stats plugin.
 */
const DEFAULT_TIME_TIERS = {
  'deepseek-flash': {
    peak: { input: 2, hit: 0.04, output: 8, cw: 0 },
    offpeak: { input: 1, hit: 0.02, output: 4, cw: 0 },
  },
  'deepseek-v4-pro': {
    peak: { input: 9, hit: 0.3, output: 27, cw: 0 },
    offpeak: { input: 4.5, hit: 0.15, output: 13.5, cw: 0 },
  },
};
const TIME_WINDOW_LABEL = '09:00–12:00 / 14:00–18:00';

function isPeak(ts) {
  const b = new Date(num(ts, 0) + 8 * 3600000);
  const day = b.getUTCDay();
  if (day === 0 || day === 6) return false;
  const m = b.getUTCHours() * 60 + b.getUTCMinutes();
  return (m >= 540 && m < 720) || (m >= 840 && m < 1080);
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function plan(p) {
  p = p && typeof p === 'object' ? p : {};
  return {
    input: num(p.input, 0),
    hit: num(p.hit, 0),
    output: num(p.output, 0),
    cw: num(p.cw, 0),
  };
}

function sanitizePrice(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return num(fallback, 0);
  return Math.min(n, 1e7);
}

function sanitizePlan(p, fallback) {
  p = p && typeof p === 'object' ? p : {};
  const f = fallback && typeof fallback === 'object' ? fallback : {};
  return {
    input: sanitizePrice(p.input, f.input),
    hit: sanitizePrice(p.hit, f.hit),
    output: sanitizePrice(p.output, f.output),
    cw: sanitizePrice(p.cw, f.cw),
  };
}

/** Accept a full editable pricing document: one default plan + per-model plans. */
function sanitizeDoc(doc, base) {
  const b = base && typeof base === 'object' ? base : {};
  const out = { default: sanitizePlan(doc && doc.default, b.default), models: {} };
  const models = doc && doc.models && typeof doc.models === 'object' ? doc.models : {};
  let count = 0;
  for (const [k, v] of Object.entries(models)) {
    if (count++ >= 300) break;
    const id = str(k).trim().slice(0, 160);
    if (!id || !v || typeof v !== 'object') continue;
    out.models[id] = sanitizePlan(v, b.default);
  }
  return out;
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function storageFile(config, ctx) {
  try {
    if (config && config.storageFile) return path.resolve(String(config.storageFile));
    // Shell commands get DSH_PROFILE_DIR from the per-execution shell overlay,
    // but the Host process itself does not — ask the profile context directly.
    let dir = process.env.DSH_PROFILE_DIR;
    if (!dir && ctx && typeof ctx.get === 'function') {
      const profile = ctx.get('profileContext');
      if (profile && typeof profile.dir === 'string' && profile.dir) dir = profile.dir;
    }
    if (dir) return path.join(dir, 'mimo-quota-usage.json');
  } catch {}
  return null;
}

function loadStore(file, retentionMs) {
  const empty = { records: [], sessions: {} };
  if (!file || !existsSync(file)) return empty;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    const recs = Array.isArray(raw) ? raw : raw && Array.isArray(raw.records) ? raw.records : [];
    const sess =
      !Array.isArray(raw) && raw && raw.sessions && typeof raw.sessions === 'object' ? raw.sessions : {};
    const cutoff = Date.now() - retentionMs;
    const sessions = {};
    for (const [id, meta] of Object.entries(sess)) {
      if (!id || !meta || typeof meta !== 'object') continue;
      sessions[id] = { title: str(meta.title).slice(0, 200), dir: str(meta.dir).slice(0, 400) };
    }
    return {
      records: recs
        .filter((r) => r && typeof r.ts === 'number' && r.ts >= cutoff && typeof r.model === 'string')
        .sort((a, b) => a.ts - b.ts)
        .slice(-MAX_RECORDS),
      sessions,
    };
  } catch {
    return empty;
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseMinute(text) {
  const s = str(text).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return 0;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);

/** Decompress a session log: concatenated zstd frames or plain JSONL bytes. */
function decompressSessionLog(buf) {
  try {
    const starts = [];
    let i = buf.indexOf(ZSTD_MAGIC);
    while (i >= 0 && starts.length < 200000) {
      starts.push(i);
      i = buf.indexOf(ZSTD_MAGIC, i + 4);
    }
    if (starts.length) {
      let out = '';
      for (let k = 0; k < starts.length; k++) {
        const end = k + 1 < starts.length ? starts[k + 1] : buf.length;
        try {
          out += zstdDecompressSync(buf.subarray(starts[k], end)).toString('utf8');
        } catch {}
      }
      if (out) return out;
    }
  } catch {}
  try {
    return zstdDecompressSync(buf).toString('utf8');
  } catch {
    return '';
  }
}

/** Latest persisted log per session across every project directory. */
function discoverSessionFiles() {
  const root = path.join(os.homedir(), '.dsh', 'sessions');
  const out = [];
  if (!existsSync(root)) return out;
  const seen = new Set();
  let projects = [];
  try {
    projects = readdirSync(root);
  } catch {
    return out;
  }
  for (const p of projects) {
    const pPath = path.join(root, p);
    try {
      if (!statSync(pPath).isDirectory()) continue;
    } catch {
      continue;
    }
    let ids = [];
    try {
      ids = readdirSync(pPath);
    } catch {
      continue;
    }
    for (const id of ids) {
      if (seen.has(id)) continue;
      const sPath = path.join(pPath, id);
      try {
        if (!statSync(sPath).isDirectory()) continue;
        const files = readdirSync(sPath).filter(
          (f) => f.startsWith('session') && (f.endsWith('.zstd') || f.endsWith('.jsonl')),
        );
        if (!files.length) continue;
        files.sort().reverse();
        out.push({ id, filePath: path.join(sPath, files[0]) });
        seen.add(id);
      } catch {}
    }
  }
  return out;
}

function bucketStart(ts, granularity) {
  const d = new Date(ts);
  if (granularity === 'day') d.setHours(0, 0, 0, 0);
  else d.setMinutes(0, 0, 0, 0);
  return d.getTime();
}

function nextBucket(ts, granularity) {
  const d = new Date(ts);
  if (granularity === 'day') d.setDate(d.getDate() + 1);
  else d.setHours(d.getHours() + 1);
  return d.getTime();
}

function intParam(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function svc(ctx, name) {
  try {
    if (ctx && typeof ctx.get === 'function') {
      const v = ctx.get(name);
      if (v) return v;
    }
  } catch {}
  try {
    return ctx ? ctx[name] : null;
  } catch {
    return null;
  }
}

export function apply(ctx, config) {
  const cfg = config && typeof config === 'object' ? config : {};
  const currency = typeof cfg.currency === 'string' && cfg.currency ? cfg.currency : DEFAULT_CURRENCY;
  const retentionDays = num(cfg.retentionDays, 90);
  const retentionMs = Math.max(1, retentionDays) * 86400000;

  const pricingCfg = cfg.pricing && typeof cfg.pricing === 'object' ? cfg.pricing : {};
  const pricingBase = {
    default: plan(pricingCfg.default || DEFAULT_PRICING.default),
    models: { ...DEFAULT_PRICING.models },
  };
  if (pricingCfg.models && typeof pricingCfg.models === 'object') {
    for (const [k, v] of Object.entries(pricingCfg.models)) pricingBase.models[str(k)] = plan(v);
  }
  // Effective pricing: built-in defaults + config overrides + the editable file.
  let pricing = pricingBase;
  let modelKeys = [];
  function rebuildPricing() {
    modelKeys = Object.keys(pricing.models).sort((a, b) => b.length - a.length);
  }
  rebuildPricing();

  function priceFor(model) {
    const m = str(model);
    if (pricing.models[m]) return pricing.models[m];
    for (const k of modelKeys) if (m.startsWith(k)) return pricing.models[k];
    for (const k of modelKeys) if (m.includes(k)) return pricing.models[k];
    return pricing.default;
  }

  function planFor(r) {
    const m = str(r.model);
    if (pricing.models[m]) return pricing.models[m];
    const tier = DEFAULT_TIME_TIERS[m];
    if (tier) return isPeak(r.ts) ? tier.peak : tier.offpeak;
    return priceFor(m);
  }

  function costOf(r) {
    const p = planFor(r);
    const cost =
      ((r.input || 0) * p.input +
        (r.cacheRead || 0) * p.hit +
        (r.cacheWrite || 0) * p.cw +
        (r.output || 0) * p.output) /
      1e6;
    return Math.round(cost * 1e6) / 1e6;
  }

  const file = storageFile(cfg, ctx);
  const pricingFile = file ? path.join(path.dirname(file), 'mimo-quota-pricing.json') : null;
  const store = loadStore(file, retentionMs);
  let records = store.records;
  const sessionMeta = store.sessions;
  const importFile = file ? path.join(path.dirname(file), 'mimo-quota-import.csv') : null;
  // Session event logs are the single source of truth: per-call records are
  // rebuilt from disk at start and extended live through the same fold.
  const stepRec = new Map(); // sessionId -> Map<`${turn}:${step}`, record>
  const fileCounts = new Map(); // sessionId -> events folded from the log file
  const liveStates = new Map(); // Session object -> { cursor, model, provider }

  function loadPricingFile() {
    if (!pricingFile || !existsSync(pricingFile)) return;
    try {
      const doc = JSON.parse(readFileSync(pricingFile, 'utf8'));
      pricing = sanitizeDoc(doc, pricingBase);
      rebuildPricing();
    } catch {}
  }
  loadPricingFile();
  let disposed = false;
  let saveTimer = null;

  function flush() {
    if (!file) return;
    try {
      writeFileSync(file, JSON.stringify({ version: 3, source: 'events', records, sessions: sessionMeta }));
    } catch {}
  }

  function scheduleSave() {
    if (!file || saveTimer || disposed) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      flush();
    }, SAVE_DELAY);
    if (saveTimer.unref) saveTimer.unref();
  }

  function bucketFor(sid) {
    let b = stepRec.get(sid);
    if (!b) {
      b = new Map();
      stepRec.set(sid, b);
    }
    return b;
  }

  function makeUsageRecord(sid, st, ev, usage) {
    const input = num(usage && usage.inputTokens, 0);
    const output = num(usage && usage.outputTokens, 0);
    const cacheRead = num(usage && usage.cacheReadTokens, 0);
    const cacheWrite = num(usage && usage.cacheWriteTokens, 0);
    return {
      ts: typeof ev.time === 'number' ? ev.time : Date.now(),
      model: str(st.model) || 'unknown',
      provider: str(st.provider),
      purpose: '',
      session: sid,
      input,
      output,
      cacheRead,
      cacheWrite,
      total: num(usage && usage.totalTokens, 0) || input + output + cacheRead + cacheWrite,
      requests: 1,
    };
  }

  function upsertUsage(sid, bucket, st, ev, usage) {
    const key = `${ev.data && ev.data.turn}:${ev.data && ev.data.step}`;
    const rec = makeUsageRecord(sid, st, ev, usage);
    const existing = bucket.get(key);
    if (existing) {
      // Same step seen again: streaming chunk first, final message wins.
      existing.ts = rec.ts;
      existing.model = rec.model;
      existing.provider = rec.provider;
      existing.input = rec.input;
      existing.output = rec.output;
      existing.cacheRead = rec.cacheRead;
      existing.cacheWrite = rec.cacheWrite;
      existing.total = rec.total;
    } else {
      bucket.set(key, rec);
      records.push(rec);
      if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    }
  }

  // Fold one session event into the usage store and session metadata.
  function foldEvent(sid, bucket, st, ev) {
    if (!ev || typeof ev.type !== 'string') return;
    switch (ev.type) {
      case 'session': {
        const meta = sessionMeta[sid] || (sessionMeta[sid] = { title: '', dir: '' });
        if (typeof ev.cwd === 'string' && ev.cwd && !meta.dir) meta.dir = ev.cwd.slice(0, 400);
        break;
      }
      case 'request/header': {
        const c = ev.data && ev.data.header && ev.data.header.config;
        if (c) {
          if (c.model) st.model = str(c.model);
          if (c.provider) st.provider = str(c.provider);
        }
        break;
      }
      case 'request/context':
        if (ev.data) {
          if (ev.data.model) st.model = str(ev.data.model);
          if (ev.data.provider) st.provider = str(ev.data.provider);
        }
        break;
      case 'assistant/chunk':
        if (ev.data && ev.data.chunk && ev.data.chunk.type === 'usage' && ev.data.chunk.usage) {
          upsertUsage(sid, bucket, st, ev, ev.data.chunk.usage);
        }
        break;
      case 'assistant/message':
        if (ev.data && ev.data.usage) upsertUsage(sid, bucket, st, ev, ev.data.usage);
        break;
      case 'session/title':
        if (ev.data && ev.data.title) {
          const meta = sessionMeta[sid] || (sessionMeta[sid] = { title: '', dir: '' });
          meta.title = str(ev.data.title).slice(0, 200);
        }
        break;
      default:
        break;
    }
  }

  // One-shot CSV backfill from an external full-session export. Each session is
  // split across its active span so the trend stays plausible; sessionless live
  // rows inside the CSV time window are pruned to avoid double counting.
  function runImport() {
    if (!importFile || !existsSync(importFile)) return;
    let text = '';
    try {
      text = readFileSync(importFile, 'utf8');
    } catch {
      return;
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const done = (suffix) => {
      try {
        renameSync(importFile, importFile + '.' + Date.now() + suffix);
      } catch {}
    };
    if (lines.length < 2) return done('.empty');
    const head = parseCsvLine(lines[0]).map((h) => str(h).trim());
    const at = (name) => head.indexOf(name);
    const cId = at('会话ID');
    const cTitle = at('标题');
    const cDir = at('工作目录');
    const cCreate = at('创建时间');
    const cActive = at('最后活跃');
    const cSteps = at('步数');
    const cIn = at('原始输入tokens');
    const cOut = at('输出tokens');
    const cHit = at('缓存命中');
    const cW = at('缓存写入');
    const cModel = at('最后模型');
    if (cId < 0 || cIn < 0) return done('.bad');

    let maxActive = 0;
    let added = 0;
    for (let li = 1; li < lines.length; li++) {
      const cells = parseCsvLine(lines[li]);
      const get = (i) => (i >= 0 ? str(cells[i]).trim() : '');
      const id = get(cId);
      if (!id || sessionMeta[id]) continue;
      const input = Math.max(0, num(get(cIn), 0));
      const output = Math.max(0, num(get(cOut), 0));
      const cacheRead = Math.max(0, num(get(cHit), 0));
      const cacheWrite = Math.max(0, num(get(cW), 0));
      const total = input + output + cacheRead + cacheWrite;
      if (!total) continue;
      const created = parseMinute(get(cCreate)) || Date.now();
      const active = parseMinute(get(cActive)) || created;
      if (active > maxActive) maxActive = active;
      const steps = Math.max(0, Math.floor(num(get(cSteps), 0)));
      const model = get(cModel) || 'unknown';
      sessionMeta[id] = { title: get(cTitle).slice(0, 200), dir: get(cDir).slice(0, 400) };

      const span = Math.max(0, active - created);
      const parts = Math.min(48, Math.max(1, Math.floor(span / 3540000) + 1));
      const amounts = { input, output, cacheRead, cacheWrite, total, requests: steps };
      for (let p = 0; p < parts; p++) {
        const rec = {
          ts: parts === 1 ? active : created + Math.round((span * p) / (parts - 1)),
          model,
          provider: model.startsWith('mimo') ? 'xiaomi' : model.startsWith('deepseek') ? 'deepseek' : '',
          purpose: '',
          session: id,
        };
        for (const [k, v] of Object.entries(amounts)) {
          const base = Math.floor(v / parts);
          rec[k] = p === parts - 1 ? v - base * (parts - 1) : base;
        }
        records.push(rec);
        added++;
      }
    }
    if (maxActive) {
      const cutoff = maxActive + 60000;
      records = records.filter((r) => (r && r.session) || (r && r.ts >= cutoff));
    }
    records.sort((a, b) => a.ts - b.ts);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    if (added) scheduleSave();
    done('.done');
  }

  try {
    runImport();
  } catch {}

  // Rebuild every record from the persisted session logs. When no log yields
  // data, the previous records are kept instead of wiping the panel.
  function rebuildFromEvents() {
    const targets = discoverSessionFiles();
    const texts = [];
    for (const t of targets) {
      let text = '';
      try {
        const buf = readFileSync(t.filePath);
        text = t.filePath.endsWith('.zstd') ? decompressSessionLog(buf) : buf.toString('utf8');
      } catch {}
      if (text) texts.push({ id: t.id, text });
    }
    if (!texts.length) return;
    const prior = records;
    records = [];
    stepRec.clear();
    fileCounts.clear();
    for (const item of texts) {
      const bucket = bucketFor(item.id);
      const st = { model: '', provider: '' };
      let count = 0;
      for (const line of item.text.split('\n')) {
        const s = line.trim();
        if (!s) continue;
        let ev;
        try {
          ev = JSON.parse(s);
        } catch {
          continue;
        }
        if (!ev || typeof ev.type !== 'string') continue;
        if (ev.type !== 'session') count++;
        foldEvent(item.id, bucket, st, ev);
      }
      fileCounts.set(item.id, count);
    }
    if (!records.length) records = prior;
    records.sort((a, b) => a.ts - b.ts);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    scheduleSave();
  }

  try {
    rebuildFromEvents();
  } catch {}

  // Extend the same fold live; the cursor starts at the file watermark so an
  // event is never counted twice across restart or reload boundaries.
  ctx.on('session/event', (session) => {
    try {
      const sid = str(session && session.id);
      if (!sid) return;
      const evs = session && Array.isArray(session.events) ? session.events : [];
      let st = liveStates.get(session);
      if (!st) {
        st = { cursor: fileCounts.get(sid) || 0, model: '', provider: '' };
        for (let i = 0; i < evs.length && !st.model; i++) {
          const ev = evs[i];
          if (ev && ev.type === 'request/context' && ev.data && ev.data.model) {
            st.model = str(ev.data.model);
            st.provider = str(ev.data.provider);
          } else if (ev && ev.type === 'request/header' && ev.data && ev.data.header && ev.data.header.config) {
            st.model = str(ev.data.header.config.model);
            st.provider = str(ev.data.header.config.provider);
          }
        }
        try {
          const hdr = session.header;
          const meta = sessionMeta[sid] || (sessionMeta[sid] = { title: '', dir: '' });
          if (!meta.dir && hdr && typeof hdr.cwd === 'string' && hdr.cwd) meta.dir = hdr.cwd.slice(0, 400);
        } catch {}
        liveStates.set(session, st);
      }
      if (st.cursor >= evs.length) return;
      const bucket = bucketFor(sid);
      let n = 0;
      while (st.cursor < evs.length) {
        foldEvent(sid, bucket, st, evs[st.cursor]);
        st.cursor++;
        n++;
      }
      if (n) scheduleSave();
    } catch {}
  });

  function scopeSessionSet(scope) {
    if (!scope || scope === 'all') return null;
    if (scope.startsWith('sess:')) return new Set([scope.slice(5)]);
    if (scope.startsWith('ws:')) {
      const wanted = scope.slice(3);
      const set = new Set();
      for (const sid of Object.keys(sessionMeta)) {
        const meta = sessionMeta[sid];
        if (meta && (meta.dir === wanted || sid === wanted)) set.add(sid);
      }
      try {
        const reg = svc(ctx, 'workspaceRegistry');
        const list = reg && typeof reg.list === 'function' ? reg.list() : [];
        const target = list.find((w) => str(w && w.id) === wanted || str(w && w.path) === wanted);
        for (const s of (target && target.sessionIds) || []) set.add(str(s));
      } catch {}
      return set;
    }
    return new Set();
  }

  let modelDirCache = { at: 0, list: null };

  function sleepNull(ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      if (timer && timer.unref) timer.unref();
    });
  }

  // Adapter-declared model directories (DeepSeek, Xiaomi, …), merged into the
  // model filter. A slow provider must never stall the stats response.
  async function directoryModels() {
    if (modelDirCache.list && Date.now() - modelDirCache.at < 120000) return modelDirCache.list;
    try {
      const work = (async () => {
        const out = [];
        const llm = svc(ctx, 'llm');
        if (llm && typeof llm.listProviders === 'function' && typeof llm.listModels === 'function') {
          const providers = (await llm.listProviders()) || [];
          for (const p of providers) {
            const pid = str(p && p.id);
            if (!pid) continue;
            try {
              const ms = (await llm.listModels(pid)) || [];
              for (const m of ms) {
                const id = str(m && m.id);
                if (id) out.push({ id, name: str(m.name) || id });
              }
            } catch {}
          }
        }
        return out;
      })();
      const done = await Promise.race([work, sleepNull(2500)]);
      if (done) {
        modelDirCache = { at: Date.now(), list: done };
        return done;
      }
    } catch {}
    return modelDirCache.list || [];
  }

  async function modelChoices(observed) {
    const byId = new Map();
    for (const m of await directoryModels()) if (!byId.has(m.id)) byId.set(m.id, m);
    for (const id of observed || []) {
      const mid = str(id);
      if (mid && !byId.has(mid)) byId.set(mid, { id: mid, name: mid });
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }

  const titleCache = new Map();

  async function sessionTitle(id) {
    if (!id) return '';
    if (titleCache.has(id)) return titleCache.get(id);
    let title = '';
    try {
      const sq = svc(ctx, 'sessionQuery');
      if (sq && typeof sq.readTitle === 'function') {
        const snap = await sq.readTitle(id);
        title = str(snap && snap.title);
      }
    } catch {}
    if (title) titleCache.set(id, title);
    return title;
  }

  // Conversations seen in records (most recent first) plus every workspace, so
  // the panel can scope stats to one project or one conversation.
  async function scopeChoices() {
    const last = new Map();
    for (const r of records) {
      const sid = r && r.session;
      if (!sid) continue;
      const prev = last.get(sid) || 0;
      if (r.ts > prev) last.set(sid, r.ts);
    }
    const ids = Array.from(last.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map((e) => e[0]);
    const sessions = await Promise.all(
      ids.map(async (id) => {
        const meta = sessionMeta[id];
        return { id, title: (meta && meta.title) || (await sessionTitle(id)) || id.slice(0, 8) };
      }),
    );
    const workspaces = [];
    const seen = new Set();
    for (const meta of Object.values(sessionMeta)) {
      const dir = meta && meta.dir;
      if (!dir || seen.has(dir)) continue;
      seen.add(dir);
      workspaces.push({ id: dir, title: path.basename(dir) || dir });
    }
    try {
      const reg = svc(ctx, 'workspaceRegistry');
      const list = reg && typeof reg.list === 'function' ? reg.list() : [];
      for (const w of list) {
        const id = str(w && w.id);
        const wpath = str(w && w.path);
        if (!id || seen.has(id) || (wpath && seen.has(wpath))) continue;
        seen.add(id);
        workspaces.push({ id, title: str(w && w.title) || wpath || id });
      }
    } catch {}
    return { workspaces, sessions };
  }

  function buildStats(from, to, modelFilter, granularity, scope) {
    const sessSet = scopeSessionSet(scope);
    const rows = records.filter(
      (r) =>
        r.ts >= from &&
        r.ts <= to &&
        (!modelFilter || modelFilter === 'all' || r.model === modelFilter) &&
        (!sessSet || (!!r.session && sessSet.has(r.session))),
    );
    let effGran = granularity === 'day' ? 'day' : 'hour';
    if (effGran === 'hour' && rows.length) {
      const span = Math.ceil((to - from) / 36e5);
      if (span > 800) effGran = 'day';
    }

    const byKey = new Map();
    for (const r of rows) {
      const key = bucketStart(r.ts, effGran);
      let b = byKey.get(key);
      if (!b) {
        b = { t: key, requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cost: 0 };
        byKey.set(key, b);
      }
      b.requests += num(r.requests, 1);
      b.input += r.input || 0;
      b.output += r.output || 0;
      b.cacheRead += r.cacheRead || 0;
      b.cacheWrite += r.cacheWrite || 0;
      b.total += r.total || 0;
      b.cost = Math.round((b.cost + costOf(r)) * 1e6) / 1e6;
    }

    // Fill gaps so the trend axis stays continuous.
    const buckets = [];
    if (rows.length) {
      let cur = bucketStart(Math.max(from, rows[0].ts), effGran);
      const end = bucketStart(to, effGran);
      let guard = 0;
      while (cur <= end && guard++ < 900) {
        buckets.push(
          byKey.get(cur) || { t: cur, requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cost: 0 },
        );
        cur = nextBucket(cur, effGran);
      }
    }

    const totals = { requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cost: 0 };
    for (const r of rows) {
      totals.requests += num(r.requests, 1);
      totals.input += r.input || 0;
      totals.output += r.output || 0;
      totals.cacheRead += r.cacheRead || 0;
      totals.cacheWrite += r.cacheWrite || 0;
      totals.total += r.total || 0;
      totals.cost += costOf(r);
    }
    totals.cost = Math.round(totals.cost * 1e6) / 1e6;

    const models = Array.from(new Set(records.map((r) => r.model).filter(Boolean))).sort();

    return { ok: true, now: Date.now(), currency, granularity: effGran, from, to, models, totals, buckets };
  }

  ctx.effect(() =>
    ctx.connection.fetch.register({
      path: '/api/mimo.quota',
      methods: ['GET', 'HEAD'],
      requestBody: 'buffered',
      fetch: async (request) => {
        let url;
        try {
          url = new URL(request.url, 'http://127.0.0.1');
        } catch {
          url = { searchParams: new URLSearchParams() };
        }
        const now = Date.now();
        const from = intParam(url.searchParams.get('from'), now - 24 * 36e5);
        const to = intParam(url.searchParams.get('to'), now);
        const model = str(url.searchParams.get('model')) || 'all';
        const granularity = str(url.searchParams.get('granularity')) === 'day' ? 'day' : 'hour';
        const scope = str(url.searchParams.get('scope')) || 'all';
        try {
          runImport();
        } catch {}
        const payload = buildStats(Math.min(from, to), Math.max(from, to), model, granularity, scope);
        try {
          payload.models = await modelChoices(payload.models);
          payload.scopes = await scopeChoices();
        } catch {}
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
      },
    }),
  );

  ctx.effect(() =>
    ctx.connection.fetch.register({
      path: '/api/mimo.quota.pricing',
      methods: ['GET', 'HEAD', 'POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const method = String((request && request.method) || 'GET').toUpperCase();
          if (method === 'POST') {
            let body = null;
            try {
              const text = await request.text();
              body = text ? JSON.parse(text) : null;
            } catch {}
            if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'bad-body' }, 400);
            if (body.reset === true) {
              try {
                if (pricingFile && existsSync(pricingFile)) unlinkSync(pricingFile);
              } catch {}
              pricing = pricingBase;
              rebuildPricing();
            } else {
              if (!pricingFile) return jsonResponse({ ok: false, error: 'no-storage' }, 503);
              const doc = sanitizeDoc(body, pricingBase);
              try {
                writeFileSync(pricingFile, JSON.stringify(doc, null, 2));
              } catch {
                return jsonResponse({ ok: false, error: 'write-failed' }, 500);
              }
              pricing = doc;
              rebuildPricing();
            }
            return jsonResponse({ ok: true, currency, pricing, base: pricingBase, timeReference: DEFAULT_TIME_TIERS, timeWindow: TIME_WINDOW_LABEL });
          }
          return jsonResponse({ ok: true, currency, pricing, base: pricingBase, timeReference: DEFAULT_TIME_TIERS, timeWindow: TIME_WINDOW_LABEL });
        } catch (error) {
          return jsonResponse({ ok: false, error: String((error && error.message) || error) }, 500);
        }
      },
    }),
  );

  ctx.effect(() => () => {
    disposed = true;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    flush();
  });
}
