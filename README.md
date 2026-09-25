# MIMO Quota Panel · 小米 MIMO 额度统计面板

DeepSeek Harness Web 端的实时用量面板插件：Token 用量、消费金额、API 请求数、输入 / 输出 tokens、趋势图与模型构成；支持模型、粒度、时间范围、统计范围（项目 / 对话）切换，30 秒自动刷新与手动刷新，内置可编辑定价系统与 DeepSeek 分时段参考价。

## 环境要求

- DeepSeek Harness 0.1.x（Web 端）
- 数据来自 Harness 的 `llm/stream` 流式事件本地测量（官方无用量接口），所有统计按记录时间归档，随插件卸载保留于 profile 目录

## 安装

以下任一方式（插件管理器 `install_bundle`，或设置 → 插件的安装入口）：

1. **安装包（推荐分发）**：直接给出 `.tgz` 安装包的绝对路径
2. **源码目录**：解压源码 zip，给出目录绝对路径
3. **git 地址 / npm 包名**：发布后可直接使用 git URL 或 registry 包名安装

安装应用成功后即在当前 profile 生效（manifest 自动写入 bundle patch），重启保留。

## 配置（profile `cordis.patch.yml` 中本插件行的 `config`）

| 字段 | 说明 | 默认 |
| --- | --- | --- |
| `storageFile` | 用量记录 JSON 路径 | `<profile>/mimo-quota-usage.json` |
| `currency` | 展示货币符号 | `¥` |
| `pricing` | 牌价覆盖（`default` + `models`，单位 ¥ / 百万 tokens） | 内建小米牌价 |

记录文件为 v2 结构：`{ version: 2, records: [...], sessions: { id: { title, dir } } }`，供统计范围与项目分组使用。

## 功能说明

- **定价面板**：默认价 + 每模型价，四个字段（输入 / 缓存命中 / 缓存写入 / 输出）可增删改，保存即时生效，可一键重置为默认
- **DeepSeek 分时段价**：`deepseek-flash`、`deepseek-v4-pro` 内建峰 / 谷价——北京时间 `09:00–12:00`、`14:00–18:00` 为峰时，其余时段与周末为谷时；消费金额按每条记录的时间自动套用对应价，在定价界面以参考表分时段展示；手动添加同名模型可覆盖内建价
- **统计范围**：全部 / 项目（按会话工作目录分组）/ 对话（带真实标题，最近 60 个）
- **历史导入**：把全会话 token 统计 CSV（表头：`会话ID,标题,工作目录,创建时间,最后活跃,轮次,步数,…,原始输入tokens,输出tokens,缓存命中,缓存写入,总tokens,最后模型`）放到 `<profile>/mimo-quota-import.csv`，刷新页面即合并：按会话去重、剔除时间窗内重叠的旧记录防止重复计数，完成后文件自动改名 `.done`

## 打包

```powershell
npm pack --pack-destination dist
# 产出 dist/local-mimo-quota-<version>.tgz —— 既是本地安装包，也是发布资产
```

## 发布到插件市场

市场安装优先级：**经仓库验证的 npm 包 → 作者 GitHub Release 预构建 tarball → 整仓 GitHub 源码**。因此：

1. 把 `package.json` 的 `name` 改成可发布的公共名（如 `dsh-mimo-quota` 或你的 scope），发布时移除 `private`
2. 补齐 `repository` / `homepage` / `bugs`，打 tag `v<version>`
3. 方式 A：`npm publish`（无 scope 或你持有的 scope）
4. 方式 B：GitHub Release 挂 `npm pack` 产出的 `.tgz` 作为预构建资产（安装最快、无需构建脚本）
5. 在市场提交目录映射（npm 包名或 GitHub 仓库地址）

## 免责声明

消费金额为按牌价与分时段规则的**估算值**，不是账单；准确金额以官方控制台为准。

## License

MIT
