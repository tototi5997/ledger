# 项目进度记录

本文件用于跨对话延续开发上下文。每完成一个任务，都必须更新本文件，记录完成内容、验证结果和下一步建议。

## 当前状态

- 当前分支：`main`。
- GitHub remote：`git@github.com:tototi5997/ledger.git`。
- 最新已推送提交：`704e8ef 实现统计页`。
- 本地工作区：有未提交的设置页退出登录按钮、交易列表筛选和 PWA 配置改动。
- 当前认证方案：邮箱 + 密码。
- 当前 Supabase 项目 URL：`https://edyzepnecvijedjcoxpv.supabase.co`。
- `.env.local` 已配置本地 Supabase 环境变量，且被 `.gitignore` 忽略。
- 当前新增依赖：`recharts`，用于统计页图表。

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
- 已初始化 shadcn/ui，并生成基础 `Button` 组件。
- 已移除 Google Fonts 构建和运行时依赖，避免访问外部字体服务。
- 已配置 Supabase SSR/browser client。
- 已按 Next.js 16 使用 `src/proxy.ts` 做会话保护。

### 认证

- 已实现邮箱 + 密码注册。
- 已实现邮箱 + 密码登录。
- 已实现退出登录的 Server Action。
- 已在设置页接入退出登录按钮。
- 退出登录前有二次确认，移动端为底部弹层，桌面端为居中模态框。
- 退出成功后跳转到 `/login`。
- 注册或登录后会幂等初始化用户空间。

### 数据库与 RLS

已创建 Supabase migration：

- `supabase/migrations/202605100001_initial_schema.sql`
- `supabase/migrations/202605100002_profiles_email.sql`
- `supabase/migrations/202605100003_funding_sources_delete_policy.sql`
- `supabase/migrations/202605110001_category_tags_delete_policy.sql`

核心表：

- `profiles`
- `ledgers`
- `funding_sources`
- `category_tags`
- `transactions`

当前规则：

- 每个用户一个默认账本。
- 资金渠道和分类标签按账本隔离。
- 交易删除使用 `deleted_at` 软删除。
- RLS 限制用户只能访问自己的账本数据。
- 资金渠道未被交易使用时可删除；已被交易使用时只能隐藏。
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

### 资金渠道管理

- 已实现设置页入口：`/settings`。
- 已实现资金渠道管理页：`/settings/funding-sources`。
- 支持新增、编辑、隐藏、删除资金渠道。
- 删除资金渠道前会检查是否有交易引用。
- 已被交易使用的资金渠道不能删除，只能隐藏。
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

## 最近验证结果

以下命令已通过：

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

最近一次构建包含以下路由：

- `/`
- `/analytics`
- `/login`
- `/manifest.webmanifest`
- `/settings`
- `/settings/category-tags`
- `/settings/funding-sources`
- `/transactions`
- `/transactions/[id]/edit`
- `/transactions/new`

## 未完成事项

建议后续优先级：

1. 配置 Vercel 部署与生产环境变量。
2. 执行生产 Supabase migration 并完成部署验收。
3. 部署后检查 Vercel Function 区域与 Supabase 项目区域是否接近，必要时调整区域以降低服务端数据库往返延迟。
4. 根据需要优化交易列表滑动交互，例如点击其他项自动收起。

## 下次对话建议开场

可以直接说明：

> 请阅读 `docs/PROJECT_PROGRESS.md`、`docs/PRODUCT_REQUIREMENTS.md`、`docs/TECHNICAL_DESIGN.md` 和 `AGENTS.md`，继续开发未完成事项。

如果继续按优先级推进，建议下一步实现：

- 配置 Vercel 部署与生产环境变量。
