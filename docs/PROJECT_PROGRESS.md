# 项目进度记录

本文件用于跨对话延续开发上下文。每完成一个任务，都必须更新本文件，记录完成内容、验证结果和下一步建议。

## 当前状态

- 当前分支：`main`。
- GitHub remote：`git@github.com:tototi5997/ledger.git`。
- 最新本地跟踪提交：`73cbb7f 完善页面加载骨架屏`。
- 本地工作区：有本次资产管理基础版、邮箱验证登录和密码找回实现改动，尚未提交。
- 当前认证方案：邮箱 + 密码 + 注册邮箱验证 + 邮箱密码找回。
- 当前 Supabase 项目 URL：`https://edyzepnecvijedjcoxpv.supabase.co`。
- `.env.local` 已配置本地 Supabase API 环境变量，且被 `.gitignore` 忽略；自动 migration 还需要补充 `DATABASE_URL` 或 `DIRECT_URL`。
- 当前新增依赖：`recharts`，用于统计页图表；`pg`，用于本地数据库 migration 脚本。

## 已完成内容

### 文档

- 已完成产品文档：`docs/PRODUCT_REQUIREMENTS.md`。
- 已完成技术开发文档：`docs/TECHNICAL_DESIGN.md`。
- 已生成设计参考文档：`DESIGN.md`。
- 已将项目协作规则中文化：`AGENTS.md`。
- 已新增本进度文档：`docs/PROJECT_PROGRESS.md`。

### 项目基础

- 已初始化 Next.js App Router + TypeScript + Tailwind CSS 项目。
- 已使用 pnpm 作为包管理器。
- 已新增 `pnpm db:migrate`，按顺序执行 `supabase/migrations/*.sql`，并通过 `public.schema_migrations` 跳过已执行 migration。
- 已将 `pnpm dev` 调整为先执行 `pnpm db:migrate`，再启动 Next.js 开发服务器。
- 已初始化 shadcn/ui，并生成基础 `Button` 组件。
- 已移除 Google Fonts 构建和运行时依赖，避免访问外部字体服务。
- 已配置 Supabase SSR/browser client。
- 已按 Next.js 16 使用 `src/proxy.ts` 做会话保护。

### 认证

- 已实现邮箱 + 密码注册。
- 注册后会发送邮箱验证邮件，未验证邮箱不会直接进入业务页面。
- 已新增邮箱验证回调路由：`/auth/confirm`。
- 邮箱验证成功后会幂等初始化用户空间，并跳转到首页。
- 已实现邮箱 + 密码登录。
- 未验证邮箱登录时会提示先完成邮箱确认。
- 已实现邮箱密码找回：用户可通过注册邮箱接收重设链接，并在 `/reset-password` 设置新密码。
- 已实现退出登录的 Server Action。
- 已在设置页接入退出登录按钮。
- 退出登录前有二次确认，移动端为底部弹层，桌面端为居中模态框。
- 退出成功后跳转到 `/login`。
- 邮箱验证成功或登录后会幂等初始化用户空间。

### 数据库与 RLS

已创建 Supabase migration：

- `supabase/migrations/202605100001_initial_schema.sql`
- `supabase/migrations/202605100002_profiles_email.sql`
- `supabase/migrations/202605100003_funding_sources_delete_policy.sql`
- `supabase/migrations/202605110001_category_tags_delete_policy.sql`
- `supabase/migrations/202605290001_asset_balance_snapshots.sql`

核心表：

- `profiles`
- `ledgers`
- `funding_sources`
- `category_tags`
- `transactions`
- `funding_source_balance_snapshots`

当前规则：

- 每个用户一个默认账本。
- 资金渠道和分类标签按账本隔离。
- 交易删除使用 `deleted_at` 软删除。
- RLS 限制用户只能访问自己的账本数据。
- 资金渠道未被交易或有效余额快照使用时可删除；已被交易或有效余额快照使用时只能隐藏。
- 分类标签删除时，相关交易会迁移到同类型“其他”标签，再删除原标签。

注意：如果远端 Supabase 尚未执行最新 migration，需要手动在 SQL Editor 中执行。

### 记账功能

- 已实现新增交易页：`/transactions/new`。
- 新增交易字段顺序：类型、资金渠道、金额、分类标签、日期、备注。
- 金额输入已限制为数字和小数点，最多两位小数。
- 已实现编辑交易页：`/transactions/[id]/edit`。
- 编辑交易时可修改：收入/支出、资金渠道、金额、分类标签、日期、备注。
- 编辑历史交易时，如果当前使用的资金渠道或分类标签已隐藏，仍可显示并保留。
- 已实现交易软删除。
- 删除交易前有二次确认，移动端为底部弹层，桌面端为居中模态框。

### 交易列表

- 已实现交易列表页：`/transactions`。
- 首屏加载 50 条交易。
- 点击“加载更多”继续分页加载。
- 支持按年份、月份、收入/支出、资金渠道和分类标签筛选。
- 默认展示全部交易，不带筛选条件。
- 筛选状态使用 URL query 参数保存。
- 筛选后点击“加载更多”会按相同筛选条件继续分页。
- 筛选入口位于交易列表头部，筛选控件在弹窗中展示。
- 筛选弹窗移动端为底部弹层，桌面端为居中模态框。
- 交易筛选不支持关键词搜索。
- 交易列表展示日期；有备注时展示为 `日期 · 备注`。
- 交易列表项默认不常驻展示编辑/删除按钮。
- 交易列表项支持向左滑动，露出“编辑”和“删除”操作区。

### 首页

- 已实现首页基础统计：
  - 本月收入。
  - 本月支出。
  - 本月结余。
- 已实现首页最近交易。
- 首页保留“统计”、“设置”和“新增记账”入口。

### 统计页

- 已实现统计页：`/analytics`。
- 支持按年份和月份筛选，默认展示当前年月。
- 展示月度收入、月度支出和月度结余。
- 使用 Recharts 展示资金渠道汇总、支出分类汇总、收入分类汇总和每日趋势。
- 每日趋势展示每日收入、支出和结余。
- 无交易时展示“本月无交易”空状态，不提供新增按钮。
- 交易、资金渠道和分类标签变更后会刷新统计页。

### 资产管理

- 已实现资产页：`/assets`。
- 支持为资金渠道设置或校准余额快照。
- 余额快照使用 `funding_source_balance_snapshots` 表保存，并通过 RLS 限制用户只能访问自己账本下的数据。
- 资产页展示当前总资产、本月变化、最近校准时间、资金渠道余额和最近 30 天总资产趋势。
- 余额计算口径为：最近一次有效余额快照 + 快照日期之后的有效收入 - 快照日期之后的有效支出。
- 未设置余额快照的资金渠道显示为“未设置”，不纳入总资产。
- 余额快照不参与收入、支出和月度结余统计。
- 已隐藏但存在余额快照或历史交易的资金渠道仍会在资产页中展示。
- 首页新增“资产”入口，设置页新增“资产总览”入口。
- 新增、编辑和软删除交易后会刷新资产页。

### 资金渠道管理

- 已实现设置页入口：`/settings`。
- 已实现资金渠道管理页：`/settings/funding-sources`。
- 支持新增、编辑、隐藏、删除资金渠道。
- 删除资金渠道前会检查是否有交易引用或有效余额快照引用。
- 已被交易或有效余额快照使用的资金渠道不能删除，只能隐藏。
- 删除操作有二次确认。

### 分类标签管理

- 已实现分类标签管理页：`/settings/category-tags`。
- 支持按“收入标签 / 支出标签”筛选展示。
- 默认展示收入标签。
- 支持新增、编辑、隐藏、删除分类标签。
- 删除已被使用的分类标签时，相关交易迁移到同类型“其他”标签。
- 删除操作有二次确认。

### PWA

- 已实现 `src/app/manifest.ts`，构建后生成 `/manifest.webmanifest`。
- Manifest 配置应用名称、短名称、描述、启动路径、独立窗口模式、主题色和背景色。
- 已新增纯文字 `Ledger` SVG 图标：
  - `public/icons/ledger-icon-192.svg`
  - `public/icons/ledger-icon-512.svg`
- 已配置主题色 `#26251e`，并接入 Apple Web App metadata。
- 已新增 `public/sw.js`，缓存图标、离线页和运行时静态资源。
- 已新增 `public/offline.html`，离线导航时展示友好页面。
- 已新增全局 PWA 客户端组件，自动注册 service worker。
- 已实现顶部弱网/离线提示横条。

### 性能优化

- 已优化业务页面获取默认账本的路径：普通页面只查询默认账本 ID，只有缺失默认账本时才回退执行用户空间初始化。
- 已保留登录和注册后的幂等初始化，确保新用户仍会创建默认账本、默认资金渠道和默认分类标签。
- 已在 Proxy 中跳过 Next.js 路由预取请求的 Supabase 鉴权，减少页面链接预取时的服务端请求开销。
- 已新增全局 `loading.tsx`，并优化为包含导航、标题、统计卡片、列表和图表占位的骨架屏，动态页面切换时立即展示加载反馈。
- 已为 `/transactions/[id]/edit` 新增就近 `loading.tsx`，点击交易编辑时先进入表单骨架屏，再等待服务端加载交易详情和表单选项。
- 已为 `/transactions/new` 新增就近 `loading.tsx`，点击新增记账时先进入表单骨架屏，再等待服务端加载资金渠道和分类标签。
- 已为 `/settings/funding-sources` 和 `/settings/category-tags` 新增就近 `loading.tsx`，进入管理页时先展示管理表单和列表骨架屏。

### 2026-05-29 进度盘点

- 已对照产品文档、技术文档、当前路由、Server Actions、校验逻辑、Supabase migration 和 PWA 文件完成进度核查。
- 判断当前核心 MVP 功能已基本落地：认证、默认账本初始化、交易增删改查、交易筛选分页、资金渠道管理、分类标签管理、首页统计、统计页和基础 PWA 均已有实现。
- 当前主要缺口集中在部署验收和少量产品细项：生产 Supabase migration、Vercel 环境变量与生产访问验收、PWA 真机安装验收、个人资料/默认账本信息编辑、交易关键词搜索，以及资金渠道/分类标签图标和颜色编辑。

### 2026-05-29 资产管理需求设计

- 已更新 `docs/PRODUCT_REQUIREMENTS.md`，将资产管理定义为 MVP 后续迭代能力。
- 资产管理基础版范围包括：资金渠道余额预设、余额校准、资产总览、资金渠道余额、本月净变化和总资产趋势。
- 明确资产管理第一版不做资金渠道间转账、负债账户、信用卡账单、资产收益率和多币种折算。
- 已更新 `docs/TECHNICAL_DESIGN.md`，新增 `/assets` 页面设计、余额快照表 `funding_source_balance_snapshots`、RLS 策略、资产余额计算规则、测试重点和任务拆分。
- 明确不在 `funding_sources` 上保存当前余额，余额通过“最近余额快照 + 后续有效交易”计算。
- 已同步调整资金渠道删除规则：已有交易引用或有效余额快照引用时不能硬删除，只能隐藏或先处理误录快照。

### 2026-05-29 资产管理基础版实现

- 已新增 `supabase/migrations/202605290001_asset_balance_snapshots.sql`，创建余额快照表、索引、触发器、RLS policy，并更新资金渠道 delete policy。
- 已扩展 `src/types/database.ts`，加入 `funding_source_balance_snapshots` 类型。
- 已新增资产校验、资产汇总计算、资产页、资产趋势图和余额设置表单。
- 已调整交易写入、编辑和删除后的刷新路径，确保资产页重新计算。
- 已调整资金渠道删除逻辑，应用层和 RLS 都会阻止删除已有有效余额快照的资金渠道。

### 2026-05-29 自动 migration 脚本

- 已新增 `scripts/db-migrate.mjs`。
- 已新增 `pnpm db:migrate` 脚本。
- 已将 `pnpm dev` 调整为 `pnpm db:migrate && next dev`。
- 迁移脚本会读取 `.env.local` 或 `.env` 中的 `DATABASE_URL`、`DIRECT_URL`、`SUPABASE_DB_URL` 或 `POSTGRES_URL`。
- 迁移脚本会创建 `public.schema_migrations` 记录表，避免重复执行已完成 migration。
- 如果检测到核心表和旧 policy 已存在但没有 migration 记录，脚本会接管早期 migration 记录，再继续执行后续缺失 migration。
- 已修复手动执行过资产管理 SQL 后启动报 `relation "funding_source_balance_snapshots" already exists` 的问题：脚本现在会补记已存在的资产管理 migration，资产管理 SQL 也已调整为可重复执行。

### 2026-05-29 环境变量示例补充

- 已更新 `.env.example`，补充 Supabase API 变量、`DATABASE_URL`、可选 `DIRECT_URL` 和可选 `SUPABASE_SERVICE_ROLE_KEY` 示例。
- 明确 `DATABASE_URL` / `DIRECT_URL` 用于 `pnpm db:migrate` 执行数据库 migration，不能提交真实值。

### 2026-05-29 邮箱验证登录

- 已将注册流程调整为发送邮箱验证邮件，并在登录页提示用户查收邮件。
- 注册成功后会主动清理可能产生的 session，避免 Supabase 邮箱确认未开启时未验证用户直接进入业务页面。
- 已新增 `/auth/confirm` Route Handler，使用 Supabase `verifyOtp({ token_hash, type })` 处理邮箱验证链接。
- 已调整 Proxy，未登录状态允许访问 `/auth/*` 回调路由。
- 邮箱验证成功后执行 `ensureUserWorkspace` 初始化默认账本、资金渠道和分类标签。
- 登录失败时会区分邮箱未验证错误，提示用户先打开验证邮件完成邮箱确认。
- 需要在 Supabase Auth 配置中启用邮箱确认，并将邮件模板链接配置到 `/auth/confirm`。

### 2026-05-30 邮箱密码找回

- 已新增 `/forgot-password` 页面和 Server Action，支持输入邮箱并调用 Supabase `resetPasswordForEmail` 发送密码重设邮件。
- 已新增 `/reset-password` 页面和 Server Action，支持从密码重设邮件进入后设置新密码。
- 已复用 `/auth/confirm` 处理 Supabase `recovery` 类型 token，验证成功后建立临时 session 并跳转 `/reset-password`。
- 已增加 `ledger_password_recovery` 短时 HttpOnly cookie，限制 `/reset-password` 只能在有效密码重设流程中访问。
- 更新密码成功后会清理临时 session 和 recovery cookie，并跳转 `/login?reset=1` 提示使用新密码登录。
- 已调整登录页，增加“忘记密码？”入口，并展示密码重设成功或链接失效提示。
- 已更新产品文档和技术文档，补充密码找回页面、流程、错误状态、测试范围和 Supabase 邮件模板要求。

## 最近验证结果

以下命令已通过：

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

2026-05-29 自动 migration 脚本添加后已验证：

```bash
pnpm db:migrate
```

当前因 `.env.local` 尚未配置 `DATABASE_URL` 或 `DIRECT_URL` 按预期失败，并提示补充数据库连接串。

2026-05-29 邮箱验证登录实现后已重新运行并通过：

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

最近一次性能优化后已重新运行并通过：

```bash
pnpm lint
pnpm build
```

2026-05-29 进度盘点时已重新运行并通过：

```bash
pnpm lint
pnpm build
```

2026-05-29 资产管理基础版实现后已重新运行并通过：

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

2026-05-30 邮箱密码找回实现后已重新运行并通过：

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

最近一次构建包含以下路由：

- `/`
- `/analytics`
- `/assets`
- `/auth/confirm`
- `/forgot-password`
- `/login`
- `/manifest.webmanifest`
- `/reset-password`
- `/settings`
- `/settings/category-tags`
- `/settings/funding-sources`
- `/transactions`
- `/transactions/[id]/edit`
- `/transactions/new`

## 未完成事项

建议后续优先级：

1. 在 `.env.local` 和部署环境中配置 `DATABASE_URL` 或 `DIRECT_URL`。
2. 配置 Vercel 部署与生产环境变量。
3. 执行生产 Supabase migration 并完成部署验收。
4. 部署后检查 Vercel Function 区域与 Supabase 项目区域是否接近，必要时调整区域以降低服务端数据库往返延迟。
5. 在 Supabase Auth 中启用邮箱确认，配置 Site URL、Redirect URLs、注册确认邮件模板和密码重设邮件模板。
6. 根据需要优化交易列表滑动交互，例如点击其他项自动收起。
7. 将资产管理 migration 应用到目标 Supabase 环境，并在真实账号下做一次余额设置和交易联动验收。

## 下次对话建议开场

可以直接说明：

> 请阅读 `docs/PROJECT_PROGRESS.md`、`docs/PRODUCT_REQUIREMENTS.md`、`docs/TECHNICAL_DESIGN.md` 和 `AGENTS.md`，继续开发未完成事项。

如果继续按优先级推进，建议下一步实现：

- 配置 Vercel 部署与生产环境变量。
