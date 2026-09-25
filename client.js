window.__ModuleLoader__.load({
  id: '@local/mimo-quota',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'mimo-quota';
    const PANEL_ID = 'mimo-quota';
    const REFRESH_MS = 30000;

    const zh = {
      panel: 'MIMO 额度',
      title: '模型额度与用量',
      subtitle: '实时统计 · Token、消费与请求',
      kicker: 'USAGE // 监控面板',
      live: '实时',
      refresh: '刷新',
      refreshing: '刷新中',
      updatedAt: '更新于 {time}',
      loading: '加载中…',
      error: '数据加载失败',
      retry: '重试',
      empty: '该范围内暂无调用数据',
      labelModel: '模型',
      labelScope: '统计范围',
      allScope: '全部',
      grpProject: '项目',
      grpConv: '对话',
      costPerReq: '均 {c} / 次',
      labelGran: '粒度',
      labelRange: '时间范围',
      allModels: '全部模型',
      gHour: '小时',
      gDay: '天',
      rToday: '今天',
      r24h: '近 24 小时',
      r7d: '近 7 天',
      r30d: '近 30 天',
      statTotal: 'TOKEN 总量',
      statCost: '消费金额',
      statRequests: 'API 请求次数',
      statInput: '输入 TOKENS',
      statOutput: '输出 TOKENS',
      avgPerReq: '均 {n} tok / 请求',
      costNote: '按牌价估算',
      trend: 'TOKEN 趋势',
      composition: 'TOKEN 构成',
      legPrompt: '输入（含缓存）',
      legOutput: '输出',
      legInput: '原始输入',
      legCacheRead: '缓存命中',
      legCacheWrite: '缓存写入',
      foot: '用量由本机调用记录汇总 · 消费为估算值',
      segIn: '输入',
      segOut: '输出',
      labelPrice: '定价',
      priceTitle: '定价设置',
      priceUnit: '单位：{c} / 百万 tokens',
      priceNote: '每 100 万 tokens 的单价，保存后立即用于消费金额估算',
      priceDefault: '默认单价',
      modelId: '模型 ID',
      addModel: '添加模型',
      existsMsg: '该模型已存在',
      resetPrice: '恢复默认',
      saveBtn: '保存',
      cancelBtn: '取消',
      savedMsg: '已保存，统计已更新',
      delete: '删除',
      refTitle: 'DeepSeek 分时段价（参考）',
      refNote: '北京时间 {w} 为峰时，其余时段与周末为谷时；消费金额已按每条记录的时间自动套用，手动添加同名模型可覆盖',
      peak: '峰时',
      offpeak: '谷时',
      period: '时段',
    };

    const en = {
      panel: 'MIMO Quota',
      title: 'Model Quota & Usage',
      subtitle: 'Realtime stats · tokens, cost and requests',
      kicker: 'USAGE // MONITOR',
      live: 'LIVE',
      refresh: 'Refresh',
      refreshing: 'Refreshing',
      updatedAt: 'Updated {time}',
      loading: 'Loading…',
      error: 'Failed to load stats',
      retry: 'Retry',
      empty: 'No calls in this range',
      labelModel: 'Model',
      labelScope: 'Scope',
      allScope: 'All',
      grpProject: 'Projects',
      grpConv: 'Conversations',
      costPerReq: '{c} / request avg',
      labelGran: 'Granularity',
      labelRange: 'Range',
      allModels: 'All models',
      gHour: 'Hour',
      gDay: 'Day',
      rToday: 'Today',
      r24h: 'Last 24h',
      r7d: 'Last 7d',
      r30d: 'Last 30d',
      statTotal: 'TOTAL TOKENS',
      statCost: 'EST. COST',
      statRequests: 'API REQUESTS',
      statInput: 'INPUT TOKENS',
      statOutput: 'OUTPUT TOKENS',
      avgPerReq: '{n} tok / request avg',
      costNote: 'Estimated from list price',
      trend: 'TOKEN TREND',
      composition: 'TOKEN COMPOSITION',
      legPrompt: 'Prompt (incl. cache)',
      legOutput: 'Completion',
      legInput: 'Raw input',
      legCacheRead: 'Cache hit',
      legCacheWrite: 'Cache write',
      foot: 'Aggregated from local call records · cost is an estimate',
      segIn: 'Input',
      segOut: 'Output',
      labelPrice: 'Pricing',
      priceTitle: 'Pricing settings',
      priceUnit: 'Unit: {c} / 1M tokens',
      priceNote: 'List price per 1M tokens; saved values apply to cost estimates immediately',
      priceDefault: 'Default plan',
      modelId: 'Model id',
      addModel: 'Add model',
      existsMsg: 'Model already exists',
      resetPrice: 'Reset to defaults',
      saveBtn: 'Save',
      cancelBtn: 'Cancel',
      savedMsg: 'Saved · stats updated',
      delete: 'Remove',
      refTitle: 'DeepSeek time-tiered prices (reference)',
      refNote: 'Beijing {w} = peak; other hours and weekends are off-peak. Cost stats apply the tier by each record’s time; adding a model with the same id overrides it.',
      peak: 'Peak',
      offpeak: 'Off-peak',
      period: 'Period',
    };

    const CSS = `
.mqp-page{box-sizing:border-box;min-height:100%;padding:22px 26px 34px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-family:ui-rounded,'Segoe UI Variable Text','Segoe UI','PingFang SC','Microsoft YaHei UI',system-ui,-apple-system,sans-serif;font-size:14px;font-variant-numeric:tabular-nums}
.mqp-page *{box-sizing:border-box}
.mqp-mono{font-family:'JetBrains Mono','Cascadia Mono',ui-monospace,Consolas,'Courier New',monospace;font-variant-numeric:tabular-nums}
.mqp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.mqp-kicker{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:var(--dsw-alias-state-warn-primary)}
.mqp-h1{margin:6px 0 5px;font-size:26px;font-weight:700;line-height:1.3;letter-spacing:.04em}
.mqp-sub{font-size:13.5px;color:var(--dsw-alias-label-secondary)}
.mqp-headRight{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.mqp-live{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.mqp-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary);animation:mqpPulse 2.2s ease-in-out infinite}
@keyframes mqpPulse{0%,100%{opacity:1}50%{opacity:.25}}
.mqp-updated{font-size:11.5px;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}
.mqp-btn{display:inline-flex;align-items:center;gap:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:9px 16px;border-radius:8px;cursor:pointer;transition:border-color .18s ease,color .18s ease,background .18s ease,transform .18s ease}
.mqp-btn:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-overlay);transform:translateY(-2px)}
.mqp-btn:disabled{opacity:.55;cursor:default}
.mqp-btn:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.mqp-spin{display:inline-block;animation:mqpRot .8s linear infinite}
@keyframes mqpRot{to{transform:rotate(360deg)}}
.mqp-hazard{height:4px;margin:14px 0 18px;background:repeating-linear-gradient(45deg,var(--dsw-alias-state-warn-primary) 0 6px,transparent 6px 12px);opacity:.5;border-radius:2px}
.mqp-controls{display:flex;flex-wrap:wrap;gap:14px 18px;align-items:flex-end;margin-bottom:16px}
.mqp-field{display:flex;flex-direction:column;gap:6px}
.mqp-flabel{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--dsw-alias-label-secondary)}
.mqp-select{position:relative;display:inline-block}
.mqp-sel{appearance:none;-webkit-appearance:none;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;font-size:13.5px;padding:9px 32px 9px 13px;border-radius:8px;min-width:150px;cursor:pointer;transition:border-color .18s ease,background .18s ease,transform .18s ease}
.mqp-select:hover .mqp-sel{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-overlay);transform:translateY(-2px)}
.mqp-sel:focus{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.mqp-caret{position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:10px;color:var(--dsw-alias-label-secondary);transition:color .18s ease,transform .18s ease}
.mqp-select:hover .mqp-caret{color:var(--dsw-alias-brand-primary);transform:translateY(-50%) translateX(3px)}
.mqp-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:16px}
.mqp-card{position:relative;overflow:hidden;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);padding:15px 17px 14px;border-radius:12px;transition:border-color .18s ease,transform .18s ease}
.mqp-card:hover{border-color:var(--dsw-alias-brand-primary);transform:translateY(-1px)}
.mqp-tick{position:absolute;top:0;right:0;width:16px;height:3px;background:var(--dsw-alias-state-warn-primary)}
.mqp-clabel{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--dsw-alias-label-secondary)}
.mqp-val{margin-top:8px;font-size:26px;font-weight:700;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mqp-valAccent{color:var(--dsw-alias-state-warn-primary)}
.mqp-sub2{margin-top:6px;font-size:12.5px;letter-spacing:.02em;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mqp-err{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-1);padding:11px 16px;margin-bottom:14px;border-radius:10px;font-size:14px;color:var(--dsw-alias-state-error-primary)}
.mqp-errBtn{background:none;border:1px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);font:inherit;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;padding:6px 13px;border-radius:6px;cursor:pointer;transition:background .15s ease,transform .15s ease}
.mqp-errBtn:hover{background:var(--dsw-alias-bg-overlay);transform:translateY(-1px)}
.mqp-charts{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(0,1fr);gap:12px}
@media (max-width:960px){.mqp-charts{grid-template-columns:1fr}}
.mqp-panel{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);padding:17px;min-width:0;border-radius:12px}
.mqp-sec{display:flex;align-items:center;gap:12px}
.mqp-secTitle{font-size:16px;font-weight:700;letter-spacing:.05em;color:var(--dsw-alias-label-primary);white-space:nowrap;border-left:4px solid var(--dsw-alias-state-warn-primary);padding-left:10px}
.mqp-gran{font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-state-warn-primary);border-radius:999px;padding:3px 12px}
.mqp-rule{flex:1;height:1px;background:var(--dsw-alias-border-l2)}
.mqp-legend{display:flex;gap:16px;margin-top:12px;flex-wrap:wrap}
.mqp-legItem{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;letter-spacing:.03em;color:var(--dsw-alias-label-secondary)}
.mqp-sw{width:10px;height:10px;flex:none;transition:transform .18s ease}
.mqp-chart{position:relative;height:240px;margin-top:16px}
.mqp-plot{position:absolute;left:56px;right:0;top:0;bottom:24px}
.mqp-gline{position:absolute;left:0;right:0;height:0;border-top:1px dashed var(--dsw-alias-border-l1)}
.mqp-ylabel{position:absolute;right:calc(100% + 8px);transform:translateY(-50%);font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.mqp-bars{position:absolute;inset:0;display:flex;align-items:stretch}
.mqp-col{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;border-radius:6px;transition:background .15s ease}
.mqp-col:hover{background:var(--dsw-alias-bg-overlay)}
.mqp-seg{width:100%;transition:filter .15s ease}
.mqp-segIn{background:var(--dsw-alias-brand-primary)}
.mqp-segOut{background:var(--dsw-alias-state-warn-primary)}
.mqp-col:hover .mqp-seg{filter:brightness(1.4) saturate(1.15)}
.mqp-xaxis{position:absolute;left:56px;right:0;bottom:0;height:20px;display:flex}
.mqp-xcell{flex:1;min-width:0;text-align:center;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden}
.mqp-empty{display:flex;align-items:center;justify-content:center;height:240px;font-size:14px;letter-spacing:.1em;color:var(--dsw-alias-label-secondary)}
.mqp-compBar{position:relative;display:flex;height:26px;margin-top:18px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);border-radius:8px;overflow:visible}
.mqp-compSeg{height:100%;min-width:2px;transition:flex-grow .3s cubic-bezier(.2,.8,.3,1),filter .2s ease;cursor:default}
.mqp-compBar.mqp-hot .mqp-compSeg{filter:saturate(.6) brightness(.85)}
.mqp-compBar.mqp-hot .mqp-compSeg.mqp-hot{filter:saturate(1.15) brightness(1.35)}
.mqp-tip{position:absolute;bottom:calc(100% + 9px);transform:translateX(-50%);background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font-size:12.5px;padding:6px 11px;border-radius:8px;white-space:nowrap;pointer-events:none;animation:mqpTip .14s ease-out;z-index:5}
@keyframes mqpTip{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.mqp-leg{margin-top:14px;display:flex;flex-direction:column;gap:3px}
.mqp-legRow{display:flex;align-items:center;gap:10px;font-size:13px;padding:6px 10px;margin:0 -10px;border-radius:6px;transition:background .15s ease}
.mqp-legRow:hover,.mqp-legRowHot{background:var(--dsw-alias-bg-overlay)}
.mqp-legRow:hover .mqp-sw,.mqp-legRowHot .mqp-sw{transform:scale(1.35)}
.mqp-legName{flex:1;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mqp-legRow:hover .mqp-legName,.mqp-legRowHot .mqp-legName{color:var(--dsw-alias-label-primary)}
.mqp-legVal{color:var(--dsw-alias-label-primary)}
.mqp-legPct{width:60px;text-align:right;color:var(--dsw-alias-label-secondary)}
.mqp-foot{margin-top:18px;font-size:12.5px;letter-spacing:.03em;color:var(--dsw-alias-label-secondary);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.mqp-yen{font-weight:700;margin-right:5px;color:var(--dsw-alias-state-warn-primary)}
.mqp-modalWrap{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px}
.mqp-backdrop{position:absolute;inset:0;background:var(--dsw-alias-bg-base);opacity:.55;animation:mqpFade .15s ease}
@keyframes mqpFade{from{opacity:0}to{opacity:.55}}
.mqp-modal{position:relative;width:min(760px,100%);max-height:84vh;overflow:auto;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:20px 22px 18px;animation:mqpRise .18s ease}
@keyframes mqpRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.mqp-modalHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.mqp-unit{font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.mqp-note{font-size:12.5px;color:var(--dsw-alias-label-secondary);margin-bottom:4px}
.mqp-subHead{font-size:13px;font-weight:700;margin:14px 0 8px;letter-spacing:.04em}
.mqp-planRow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.mqp-planCell{display:flex;flex-direction:column;gap:5px;min-width:0}
.mqp-planLabel{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.mqp-num{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;padding:8px 10px;border-radius:8px;width:100%;font-variant-numeric:tabular-nums;transition:border-color .15s ease}
.mqp-num:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.mqp-modelRow{display:grid;grid-template-columns:190px minmax(0,1fr) 34px;gap:10px;align-items:end;padding:10px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.mqp-modelId{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:9px}
.mqp-del{background:none;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);width:34px;height:36px;border-radius:8px;cursor:pointer;font-size:16px;line-height:1;transition:border-color .15s ease,color .15s ease}
.mqp-del:hover{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.mqp-addRow{display:flex;gap:10px;margin-top:14px}
.mqp-numWide{flex:1;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;padding:8px 10px;border-radius:8px;min-width:0;transition:border-color .15s ease}
.mqp-numWide:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.mqp-modalFoot{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:18px;flex-wrap:wrap}
.mqp-msg{margin-right:auto;font-size:12.5px;color:var(--dsw-alias-label-secondary);word-break:break-all}
.mqp-loading{padding:18px 0}
.mqp-loadingRow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 0}
.mqp-refTable{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;font-size:13px}
.mqp-refRow{display:grid;grid-template-columns:1.5fr .7fr repeat(4,1fr);gap:8px;padding:8px 12px;align-items:center;border-top:1px solid var(--dsw-alias-border-l1);transition:background .15s ease}
.mqp-refRow:hover{background:var(--dsw-alias-bg-overlay)}
.mqp-refRow:first-child{border-top:none}
.mqp-refHead{background:var(--dsw-alias-bg-layer-2);font-size:11.5px;font-weight:700;color:var(--dsw-alias-label-secondary)}
.mqp-refHead:hover{background:var(--dsw-alias-bg-layer-2)}
.mqp-refModel b{display:block;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mqp-refPeriod{font-size:11.5px;font-weight:700;color:var(--dsw-alias-state-warn-primary)}
.mqp-refRow span{min-width:0;white-space:nowrap;overflow:hidden}
.mqp-btnPrimary{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary)}
@media (max-width:760px){.mqp-modelRow{grid-template-columns:1fr;align-items:stretch}.mqp-del{width:100%;height:32px}}
`;

    function fmtInt(n) {
      return Math.round(Number(n) || 0).toLocaleString('en-US');
    }

    function fmtCompact(n) {
      n = Number(n) || 0;
      if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
      if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
      return String(Math.round(n));
    }

    function fmtCost(n, currency) {
      n = Number(n) || 0;
      if (n === 0) return (currency || '') + '0.00';
      if (Math.abs(n) < 1) return (currency || '') + n.toFixed(4);
      return (currency || '') + n.toFixed(2);
    }

    function pad2(n) {
      return String(n).padStart(2, '0');
    }

    function bucketLabel(ts, granularity) {
      const d = new Date(ts);
      if (granularity === 'day') return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      return pad2(d.getHours()) + ':00';
    }

    function rangeFromMs(key, now) {
      if (key === 'today') return new Date(now).setHours(0, 0, 0, 0);
      if (key === '7d') return now - 7 * 864e5;
      if (key === '30d') return now - 30 * 864e5;
      return now - 24 * 36e5;
    }

    function PanelIcon(props) {
      const size = (props && props.size) || 16;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': true, style: { display: 'block' } },
        h('rect', { x: 1.5, y: 8, width: 3, height: 6, fill: 'currentColor' }),
        h('rect', { x: 6.5, y: 5, width: 3, height: 9, fill: 'currentColor', opacity: 0.75 }),
        h('rect', { x: 11.5, y: 2, width: 3, height: 12, fill: 'currentColor', opacity: 0.5 }),
        h('path', { d: 'M1 15h14', stroke: 'currentColor', strokeWidth: 1.2, fill: 'none' }),
      );
    }

    function SelectField(props) {
      const { label, value, onChange, options } = props;
      const groupNames = [];
      for (const o of options) if (o.group && groupNames.indexOf(o.group) < 0) groupNames.push(o.group);
      const nodes = options
        .filter((o) => !o.group)
        .map((o) => h('option', { key: o.value, value: o.value }, o.label));
      for (const g of groupNames) {
        nodes.push(
          h(
            'optgroup',
            { key: '@' + g, label: g },
            options
              .filter((o) => o.group === g)
              .map((o) => h('option', { key: o.value, value: o.value }, o.label)),
          ),
        );
      }
      return h(
        'div',
        { className: 'mqp-field' },
        h('span', { className: 'mqp-flabel' }, label),
        h(
          'span',
          { className: 'mqp-select' },
          h(
            'select',
            {
              className: 'mqp-sel',
              value,
              onChange: (e) => onChange(e.target.value),
            },
            nodes,
          ),
          h('span', { className: 'mqp-caret' }, '▼'),
        ),
      );
    }

    const PRICE_FIELDS = [
      ['input', 'segIn'],
      ['hit', 'legCacheRead'],
      ['output', 'segOut'],
      ['cw', 'legCacheWrite'],
    ];

    function PlanRow(props) {
      const { t, plan, onField } = props;
      return h(
        'div',
        { className: 'mqp-planRow' },
        PRICE_FIELDS.map(([f, k]) =>
          h(
            'label',
            { key: f, className: 'mqp-planCell' },
            h('span', { className: 'mqp-planLabel' }, t(k)),
            h('input', {
              className: 'mqp-num',
              type: 'number',
              min: '0',
              step: 'any',
              value: plan[f] == null ? '' : String(plan[f]),
              onChange: (e) => onField(f, e.target.value),
            }),
          ),
        ),
      );
    }

    function StatCard(props) {
      const { label, value, sub, accent } = props;
      return h(
        'div',
        { className: 'mqp-card' },
        h('span', { className: 'mqp-tick' }),
        h('div', { className: 'mqp-clabel' }, label),
        h('div', { className: 'mqp-val mqp-mono' + (accent ? ' mqp-valAccent' : '') }, value),
        h('div', { className: 'mqp-sub2' }, sub),
      );
    }

    function TrendPanel(props) {
      const { t, buckets, granularity } = props;
      if (!buckets || !buckets.length) {
        return h('div', { className: 'mqp-empty' }, '— ' + t('empty') + ' —');
      }
      let max = 0;
      for (const b of buckets) max = Math.max(max, b.total || 0);
      max = max || 1;
      const gap = buckets.length > 180 ? '0px' : '2px';
      const labelEvery = Math.max(1, Math.ceil(buckets.length / 7));
      const seg = (value, cls) => {
        const pct = (value / max) * 100;
        if (!(value > 0)) return null;
        return h('div', { className: 'mqp-seg ' + cls, style: { height: pct + '%', minHeight: '2px' } });
      };
      const prompt = (b) => (b.input || 0) + (b.cacheRead || 0) + (b.cacheWrite || 0);
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'mqp-legend' },
          h(
            'span',
            { className: 'mqp-legItem' },
            h('span', { className: 'mqp-sw', style: { background: 'var(--dsw-alias-brand-primary)' } }),
            t('legPrompt'),
          ),
          h(
            'span',
            { className: 'mqp-legItem' },
            h('span', { className: 'mqp-sw', style: { background: 'var(--dsw-alias-state-warn-primary)' } }),
            t('legOutput'),
          ),
        ),
        h(
          'div',
          { className: 'mqp-chart' },
          h(
            'div',
            { className: 'mqp-plot' },
            [0, 0.5, 1].map((f) =>
              h(
                'div',
                { key: f, className: 'mqp-gline', style: { top: (1 - f) * 100 + '%' } },
                h('span', { className: 'mqp-ylabel mqp-mono' }, fmtCompact(max * f)),
              ),
            ),
            h(
              'div',
              { className: 'mqp-bars', style: { gap } },
              buckets.map((b, i) =>
                h(
                  'div',
                  {
                    key: i,
                    className: 'mqp-col',
                    title:
                      bucketLabel(b.t, granularity) +
                      ' · ' +
                      fmtInt(b.total) +
                      ' tok · ' +
                      fmtInt(prompt(b)) +
                      ' in / ' +
                      fmtInt(b.output) +
                      ' out',
                  },
                  seg(b.output, 'mqp-segOut'),
                  seg(prompt(b), 'mqp-segIn'),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'mqp-xaxis mqp-mono' },
            buckets.map((b, i) =>
              h('div', { key: i, className: 'mqp-xcell' }, i % labelEvery === 0 ? bucketLabel(b.t, granularity) : ''),
            ),
          ),
        ),
      );
    }

    function CompositionPanel(props) {
      const { t, totals } = props;
      const segs = [
        { key: 'legInput', v: totals.input || 0, color: 'var(--dsw-alias-brand-primary)' },
        { key: 'legCacheRead', v: totals.cacheRead || 0, color: 'var(--dsw-alias-state-success-primary)' },
        { key: 'legCacheWrite', v: totals.cacheWrite || 0, color: 'var(--dsw-alias-state-idle-primary)' },
        { key: 'legOutput', v: totals.output || 0, color: 'var(--dsw-alias-state-warn-primary)' },
      ];
      const sum = segs.reduce((a, s) => a + s.v, 0);
      const [hot, setHot] = React.useState(null);
      if (!(sum > 0)) return h('div', { className: 'mqp-empty' }, '— ' + t('empty') + ' —');
      const pctOf = (v) => ((v / sum) * 100).toFixed(1) + '%';
      const hotSeg = hot ? segs.find((s) => s.key === hot.key && s.v > 0) : null;
      const enterSeg = (s) => (e) => {
        const el = e.currentTarget;
        const bar = el.parentElement;
        const w = bar && bar.clientWidth ? bar.clientWidth : 0;
        const x = el.offsetLeft + el.offsetWidth / 2;
        const pad = 90;
        setHot({ key: s.key, x: w ? Math.min(Math.max(x, pad), Math.max(w - pad, pad)) : 0, tip: true });
      };
      const enterRow = (s) => () => setHot({ key: s.key, tip: false });
      const leave = () => setHot(null);
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'mqp-compBar' + (hot ? ' mqp-hot' : '') },
          segs.filter((s) => s.v > 0).map((s) =>
            h('div', {
              key: s.key,
              className: 'mqp-compSeg' + (hot && hot.key === s.key ? ' mqp-hot' : ''),
              style: { flexGrow: String(s.v * (hot && hot.key === s.key ? 1.7 : 1)), background: s.color },
              onMouseEnter: enterSeg(s),
              onMouseLeave: leave,
            }),
          ),
          hot && hot.tip && hotSeg
            ? h(
                'div',
                { className: 'mqp-tip mqp-mono', style: { left: hot.x + 'px' } },
                t(hotSeg.key) + ' · ' + fmtInt(hotSeg.v) + ' · ' + pctOf(hotSeg.v),
              )
            : null,
        ),
        h(
          'div',
          { className: 'mqp-leg' },
          segs.map((s) =>
            h(
              'div',
              {
                key: s.key,
                className: 'mqp-legRow' + (hot && hot.key === s.key ? ' mqp-legRowHot' : ''),
                onMouseEnter: enterRow(s),
                onMouseLeave: leave,
              },
              h('span', { className: 'mqp-sw', style: { background: s.color } }),
              h('span', { className: 'mqp-legName' }, t(s.key)),
              h('span', { className: 'mqp-legVal mqp-mono' }, fmtInt(s.v)),
              h('span', { className: 'mqp-legPct mqp-mono' }, pctOf(s.v)),
            ),
          ),
        ),
      );
    }

    function UsagePanel({ t }) {
      const [model, setModel] = React.useState('all');
      const [gran, setGran] = React.useState('hour');
      const [rangeKey, setRangeKey] = React.useState('24h');
      const [scope, setScope] = React.useState('all');
      const [nonce, setNonce] = React.useState(0);
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [pending, setPending] = React.useState(false);
      const [priceOpen, setPriceOpen] = React.useState(false);
      const [priceDoc, setPriceDoc] = React.useState(null);
      const [priceBusy, setPriceBusy] = React.useState(false);
      const [priceMsg, setPriceMsg] = React.useState('');
      const [addId, setAddId] = React.useState('');

      const changeRange = (v) => {
        setRangeKey(v);
        setGran(v === '7d' || v === '30d' ? 'day' : 'hour');
      };

      const toDoc = (json) => ({
        currency: json.currency,
        base: json.base,
        timeReference: json.timeReference || null,
        timeWindow: json.timeWindow || '',
        pricing: {
          default: { ...json.pricing.default },
          models: Object.fromEntries(
            Object.entries(json.pricing.models || {}).map(([k, v]) => [k, { ...v }]),
          ),
        },
      });

      const openPricing = async () => {
        setPriceOpen(true);
        setPriceMsg('');
        if (priceDoc) return;
        try {
          const res = await fetch('api/mimo.quota.pricing', { headers: { accept: 'application/json' } });
          const json = await res.json();
          if (json && json.ok) setPriceDoc(toDoc(json));
          else setPriceMsg((json && json.error) || 'HTTP ' + res.status);
        } catch (e) {
          setPriceMsg((e && e.message) || String(e));
        }
      };

      const setPlanField = (which, key, field, raw) => {
        setPriceDoc((d) => {
          if (!d || !d.pricing) return d;
          const pricing = { ...d.pricing };
          if (which === 'default') {
            pricing.default = { ...pricing.default, [field]: raw };
          } else {
            const models = { ...pricing.models };
            const cur = models[key] || { input: 0, hit: 0, output: 0, cw: 0 };
            models[key] = { ...cur, [field]: raw };
            pricing.models = models;
          }
          return { ...d, pricing };
        });
      };

      const removeModel = (id) => {
        setPriceDoc((d) => {
          if (!d || !d.pricing) return d;
          const models = { ...d.pricing.models };
          delete models[id];
          return { ...d, pricing: { ...d.pricing, models } };
        });
      };

      const addModel = () => {
        const id = addId.trim();
        if (!id) return;
        if (priceDoc && priceDoc.pricing.models[id]) {
          setPriceMsg(t('existsMsg'));
          return;
        }
        setPriceDoc((d) => ({
          ...d,
          pricing: {
            ...d.pricing,
            models: { ...d.pricing.models, [id]: { input: 0, hit: 0, output: 0, cw: 0 } },
          },
        }));
        setAddId('');
        setPriceMsg('');
      };

      const postPricing = async (body) => {
        setPriceBusy(true);
        setPriceMsg('');
        try {
          const res = await fetch('api/mimo.quota.pricing', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (!json || !json.ok) throw new Error((json && json.error) || 'HTTP ' + res.status);
          setPriceDoc(toDoc(json));
          setPriceMsg(t('savedMsg'));
          setNonce((n) => n + 1);
        } catch (e) {
          setPriceMsg((e && e.message) || String(e));
        } finally {
          setPriceBusy(false);
        }
      };

      const savePricing = () => {
        if (priceDoc && priceDoc.pricing) postPricing(priceDoc.pricing);
      };
      const resetPricing = () => postPricing({ reset: true });

      React.useEffect(() => {
        let cancelled = false;
        const ctrl = new AbortController();

        const load = async (silent) => {
          if (cancelled) return;
          if (!silent) setPending(true);
          try {
            const now = Date.now();
            const url =
              'api/mimo.quota?from=' +
              rangeFromMs(rangeKey, now) +
              '&to=' +
              now +
              '&model=' +
              encodeURIComponent(model) +
              '&granularity=' +
              gran +
              '&scope=' +
              encodeURIComponent(scope);
            const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (cancelled) return;
            setData(json);
            setError(null);
          } catch (e) {
            if (cancelled || (e && e.name === 'AbortError')) return;
            setError((e && e.message) || String(e));
          } finally {
            if (!cancelled) setPending(false);
          }
        };

        load(true);
        const iv = setInterval(() => load(true), REFRESH_MS);
        return () => {
          cancelled = true;
          ctrl.abort();
          clearInterval(iv);
        };
      }, [model, gran, rangeKey, scope, nonce]);

      const totals = (data && data.totals) || { requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, cost: 0 };
      const currency = (data && data.currency) || '¥';
      const granularity = (data && data.granularity) || gran;
      const avg = totals.requests > 0 ? fmtCompact(totals.total / totals.requests) : '0';
      const inShare = totals.total > 0 ? ((totals.input + totals.cacheRead + totals.cacheWrite) / totals.total) * 100 : 0;
      const outShare = totals.total > 0 ? (totals.output / totals.total) * 100 : 0;
      const models = (data && data.models) || [];
      const modelOptions = [{ value: 'all', label: t('allModels') }].concat(
        models.map((m) =>
          typeof m === 'string' ? { value: m, label: m } : { value: m.id, label: (m && m.name) || m.id },
        ),
      );
      if (model !== 'all' && !modelOptions.some((o) => o.value === model)) {
        modelOptions.push({ value: model, label: model });
      }
      const scopes = (data && data.scopes) || {};
      const scopeOptions = [{ value: 'all', label: t('allScope') }]
        .concat(
          (scopes.workspaces || []).map((w) => ({
            value: 'ws:' + w.id,
            label: w.title || w.id,
            group: t('grpProject'),
          })),
        )
        .concat(
          (scopes.sessions || []).map((s) => ({
            value: 'sess:' + s.id,
            label: s.title || s.id,
            group: t('grpConv'),
          })),
        );
      if (scope !== 'all' && !scopeOptions.some((o) => o.value === scope)) {
        scopeOptions.push({ value: scope, label: scope.split(':').slice(1).join(':') || scope });
      }

      return h(
        'div',
        { className: 'mqp-page' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h(
          'div',
          { className: 'mqp-head' },
          h(
            'div',
            null,
            h('div', { className: 'mqp-kicker' }, t('kicker')),
            h('h1', { className: 'mqp-h1' }, t('title')),
            h('div', { className: 'mqp-sub' }, t('subtitle')),
          ),
          h(
            'div',
            { className: 'mqp-headRight' },
            h(
              'span',
              { className: 'mqp-live' },
              h('span', { className: 'mqp-dot' }),
              t('live'),
            ),
            data
              ? h('span', { className: 'mqp-updated' }, t('updatedAt', { time: new Date(data.now).toLocaleTimeString() }))
              : null,
            h(
              'button',
              { className: 'mqp-btn', type: 'button', onClick: openPricing },
              h('span', { className: 'mqp-yen' }, '¥'),
              t('labelPrice'),
            ),
            h(
              'button',
              {
                className: 'mqp-btn',
                type: 'button',
                disabled: pending,
                onClick: () => {
                  setPending(true);
                  setNonce((n) => n + 1);
                },
              },
              h('span', { className: pending ? 'mqp-spin' : undefined }, '↻'),
              pending ? t('refreshing') : t('refresh'),
            ),
          ),
        ),
        h('div', { className: 'mqp-hazard' }),
        priceOpen
          ? h(
              'div',
              { className: 'mqp-modalWrap' },
              h('div', { className: 'mqp-backdrop', onClick: () => setPriceOpen(false) }),
              h(
                'div',
                { className: 'mqp-modal' },
                h(
                  'div',
                  { className: 'mqp-modalHead' },
                  h('span', { className: 'mqp-secTitle' }, t('priceTitle')),
                  h(
                    'span',
                    { className: 'mqp-unit' },
                    t('priceUnit', { c: (priceDoc && priceDoc.currency) || currency }),
                  ),
                ),
                priceDoc
                  ? [
                      h('div', { key: 'note', className: 'mqp-note' }, t('priceNote')),
                      h('div', { key: 'sd', className: 'mqp-subHead' }, t('priceDefault')),
                      h(PlanRow, {
                        key: 'defrow',
                        t,
                        plan: priceDoc.pricing.default,
                        onField: (f, v) => setPlanField('default', '', f, v),
                      }),
                      h('div', { key: 'sm', className: 'mqp-subHead' }, t('labelModel')),
                      Object.keys(priceDoc.pricing.models)
                        .sort()
                        .map((id) =>
                          h(
                            'div',
                            { key: id, className: 'mqp-modelRow' },
                            h('span', { className: 'mqp-modelId mqp-mono' }, id),
                            h(PlanRow, {
                              t,
                              plan: priceDoc.pricing.models[id],
                              onField: (f, v) => setPlanField('model', id, f, v),
                            }),
                            h(
                              'button',
                              {
                                className: 'mqp-del',
                                type: 'button',
                                title: t('delete'),
                                onClick: () => removeModel(id),
                              },
                              '×',
                            ),
                          ),
                        ),
                      h(
                        'div',
                        { key: 'add', className: 'mqp-addRow' },
                        h('input', {
                          className: 'mqp-numWide',
                          type: 'text',
                          placeholder: t('modelId'),
                          value: addId,
                          onChange: (e) => setAddId(e.target.value),
                        }),
                        h(
                          'button',
                          {
                            className: 'mqp-btn',
                            type: 'button',
                            disabled: priceBusy || !addId.trim(),
                            onClick: addModel,
                          },
                          t('addModel'),
                        ),
                      ),
                      priceDoc.timeReference && Object.keys(priceDoc.timeReference).length
                        ? h(
                            'div',
                            { key: 'ref' },
                            h('div', { className: 'mqp-subHead' }, t('refTitle')),
                            h('div', { className: 'mqp-note' }, t('refNote', { w: priceDoc.timeWindow })),
                            h(
                              'div',
                              { className: 'mqp-refTable' },
                              h(
                                'div',
                                { className: 'mqp-refRow mqp-refHead' },
                                h('span', null, t('labelModel')),
                                h('span', null, t('period')),
                                h('span', null, t('segIn')),
                                h('span', null, t('legCacheRead')),
                                h('span', null, t('legCacheWrite')),
                                h('span', null, t('segOut')),
                              ),
                              Object.keys(priceDoc.timeReference)
                                .sort()
                                .flatMap((model) => {
                                  const tier = priceDoc.timeReference[model] || {};
                                  return [
                                    { model, label: t('peak'), plan: tier.peak },
                                    { model: '', label: t('offpeak'), plan: tier.offpeak },
                                  ].map((row, ri) =>
                                    h(
                                      'div',
                                      { key: row.model + row.label + ri, className: 'mqp-refRow' },
                                      h(
                                        'span',
                                        { className: 'mqp-refModel' },
                                        ri === 0 ? h('b', null, row.model) : null,
                                      ),
                                      h('span', { className: 'mqp-refPeriod' }, row.label),
                                      ['input', 'hit', 'cw', 'output'].map((f) =>
                                        h(
                                          'span',
                                          { key: f, className: 'mqp-mono' },
                                          row.plan && row.plan[f] != null ? String(row.plan[f]) : '—',
                                        ),
                                      ),
                                    ),
                                  );
                                }),
                            ),
                          )
                        : null,
                      h(
                        'div',
                        { key: 'foot', className: 'mqp-modalFoot' },
                        h('span', { className: 'mqp-msg' }, priceMsg),
                        h(
                          'button',
                          { className: 'mqp-btn', type: 'button', disabled: priceBusy, onClick: resetPricing },
                          t('resetPrice'),
                        ),
                        h(
                          'button',
                          {
                            className: 'mqp-btn',
                            type: 'button',
                            disabled: priceBusy,
                            onClick: () => setPriceOpen(false),
                          },
                          t('cancelBtn'),
                        ),
                        h(
                          'button',
                          {
                            className: 'mqp-btn mqp-btnPrimary',
                            type: 'button',
                            disabled: priceBusy,
                            onClick: savePricing,
                          },
                          priceBusy ? t('refreshing') : t('saveBtn'),
                        ),
                      ),
                    ]
                  : h(
                      'div',
                      { className: 'mqp-loadingRow' },
                      h('span', { className: 'mqp-msg' }, priceMsg || t('loading')),
                      h(
                        'button',
                        { className: 'mqp-btn', type: 'button', onClick: () => setPriceOpen(false) },
                        t('cancelBtn'),
                      ),
                    ),
              ),
            )
          : null,
        error
          ? h(
              'div',
              { className: 'mqp-err' },
              h('span', null, t('error') + ': ' + error),
              h(
                'button',
                { className: 'mqp-errBtn', type: 'button', onClick: () => setNonce((n) => n + 1) },
                t('retry'),
              ),
            )
          : null,
        !data && !error
          ? h('div', { className: 'mqp-empty' }, t('loading'))
          : null,
        data
          ? h(
              React.Fragment,
              null,
              h(
                'div',
                { className: 'mqp-controls' },
                h(SelectField, {
                  label: t('labelModel'),
                  value: model,
                  onChange: setModel,
                  options: modelOptions,
                }),
                h(SelectField, {
                  label: t('labelScope'),
                  value: scope,
                  onChange: setScope,
                  options: scopeOptions,
                }),
                h(SelectField, {
                  label: t('labelGran'),
                  value: gran,
                  onChange: setGran,
                  options: [
                    { value: 'hour', label: t('gHour') },
                    { value: 'day', label: t('gDay') },
                  ],
                }),
                h(SelectField, {
                  label: t('labelRange'),
                  value: rangeKey,
                  onChange: changeRange,
                  options: [
                    { value: 'today', label: t('rToday') },
                    { value: '24h', label: t('r24h') },
                    { value: '7d', label: t('r7d') },
                    { value: '30d', label: t('r30d') },
                  ],
                }),
              ),
              h(
                'div',
                { className: 'mqp-stats' },
                h(StatCard, {
                  label: t('statTotal'),
                  value: fmtInt(totals.total),
                  sub: t('avgPerReq', { n: avg }),
                }),
                h(StatCard, {
                  label: t('statCost'),
                  value: fmtCost(totals.cost, currency),
                  sub: t('costNote'),
                  accent: true,
                }),
                h(StatCard, {
                  label: t('statRequests'),
                  value: fmtInt(totals.requests),
                  sub: totals.requests > 0 ? t('costPerReq', { c: fmtCost(totals.cost / totals.requests, currency) }) : '—',
                }),
                h(StatCard, {
                  label: t('statInput'),
                  value: fmtInt(totals.input + totals.cacheRead + totals.cacheWrite),
                  sub: inShare.toFixed(1) + '%',
                }),
                h(StatCard, {
                  label: t('statOutput'),
                  value: fmtInt(totals.output),
                  sub: outShare.toFixed(1) + '%',
                }),
              ),
              h(
                'div',
                { className: 'mqp-charts' },
                h(
                  'div',
                  { className: 'mqp-panel' },
                  h(
                    'div',
                    { className: 'mqp-sec' },
                    h('span', { className: 'mqp-secTitle' }, t('trend')),
                    h('span', { className: 'mqp-rule' }),
                    h('span', { className: 'mqp-secTitle mqp-gran' }, granularity === 'day' ? t('gDay') : t('gHour')),
                  ),
                  h(TrendPanel, { t, buckets: data.buckets, granularity }),
                ),
                h(
                  'div',
                  { className: 'mqp-panel' },
                  h(
                    'div',
                    { className: 'mqp-sec' },
                    h('span', { className: 'mqp-secTitle' }, t('composition')),
                    h('span', { className: 'mqp-rule' }),
                  ),
                  h(CompositionPanel, { t, totals }),
                ),
              ),
              h(
                'div',
                { className: 'mqp-foot' },
                h('span', null, t('foot')),
                h('span', null, t('updatedAt', { time: new Date(data.now).toLocaleTimeString() })),
              ),
            )
          : null,
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.locale.register(NS, { zh, en });
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, (props) =>
            h(UsagePanel, { ...props, t }),
          ),
        );

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 30,
              label: () => t('panel'),
              locale: NS,
            },
            PanelIcon,
          ),
        );
      },
    };
  },
});
