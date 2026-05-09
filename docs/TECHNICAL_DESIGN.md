# 个人日常记账应用技术开发文档

## 1. 技术栈与工程约定

### 1.1 前端框架

- 使用 Next.js App Router。
- 使用 TypeScript。
- 优先使用 React Server Components 获取页面初始数据。
- 涉及用户交互和表单的模块使用 Client Components。
- 写操作优先通过 Server Actions 或 Route Handlers 实现，避免在客户端散落数据库写入逻辑。

### 1.2 UI 与样式

- 使用 Tailwind CSS 作为主要样式方案。
- 使用 shadcn/ui 作为基础组件库。
- shadcn/ui 组件以源码形式纳入项目，允许按产品需要调整样式。
- 移动端优先设计，桌面端作为自然适配。

### 1.3 表单与校验

- 使用 React Hook Form 管理表单状态。
- 使用 Zod 定义表单 schema 和运行时校验。
- 前端表单校验和服务端写入校验使用同一套 Zod schema 或保持等价规则。
- 交易金额、手机号、资金渠道、分类标签等关键字段必须在提交前校验。

### 1.4 包管理器

- 使用 pnpm 作为包管理器。
- 项目依赖安装、脚本执行和 CI 命令统一使用 pnpm。

### 1.5 已确认产品约束

- 产品面向个人日常记账。
- 登录方式为手机号 + 密码。
- 交易类型仅包含收入和支出。
- 每笔交易必须选择一个资金渠道。
- 每笔交易必须且只能选择一个分类标签。
- 资金渠道和分类标签均支持用户自定义。
- 不做账户余额管理。
- 不做预算管理。
- 不做多人协作、分账和成员结算。

## 2. 页面路由与模块边界

### 2.1 路由结构

使用 App Router，主要路由如下：

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/login` | 登录页 | 手机号 + 密码登录和注册 |
| `/` | 首页仪表盘 | 展示本月收入、支出、结余、最近交易和快捷入口 |
| `/transactions` | 交易列表页 | 支持按月份、类型、资金渠道、分类标签筛选 |
| `/transactions/new` | 新增交易页 | 按固定流程新增收入或支出 |
| `/transactions/[id]/edit` | 编辑交易页 | 编辑已有交易 |
| `/analytics` | 统计页 | 展示月度、资金渠道、分类标签和趋势统计 |
| `/settings` | 设置页 | 个人资料、账本信息、默认币种和退出登录 |
| `/settings/funding-sources` | 资金渠道管理页 | 新增、编辑、隐藏资金渠道 |
| `/settings/category-tags` | 分类标签管理页 | 新增、编辑、隐藏收入或支出分类标签 |

### 2.2 页面访问控制

- `/login` 仅用于未登录用户。
- 登录后访问 `/login`，自动跳转到 `/`。
- 未登录用户访问业务页面，自动跳转到 `/login`。
- 所有业务页面必须基于当前 Supabase session 获取用户信息。

### 2.3 Server Components 边界

优先作为 Server Component 的页面：

- `/`
- `/transactions`
- `/analytics`
- `/settings`
- `/settings/funding-sources`
- `/settings/category-tags`

这些页面在服务端读取初始数据，减少客户端加载状态和重复请求。

### 2.4 Client Components 边界

需要作为 Client Component 的模块：

- 手机号 + 密码登录表单。
- 手机号 + 密码注册表单。
- 新增或编辑交易表单。
- 交易筛选器。
- 资金渠道新增或编辑表单。
- 分类标签新增或编辑表单。
- 删除、隐藏、退出登录等需要用户确认的交互组件。
- 图表组件，如使用 Recharts 等依赖浏览器 API 的库。

### 2.5 新增交易页面流程

新增交易使用独立页面 `/transactions/new`，不使用弹窗或抽屉作为 MVP 主流程。

表单字段顺序：

1. 交易类型：收入或支出。
2. 资金渠道。
3. 金额。
4. 分类标签，基于交易类型过滤。
5. 日期，默认当天。
6. 备注，可选。

提交成功后返回交易列表或首页，具体跳转策略在实现阶段根据入口决定。

## 3. Supabase 数据库 Schema

### 3.1 设计原则

- 保留 `ledgers` 表，MVP 每个用户自动创建一个默认个人账本。
- 所有业务数据通过 `ledger_id` 归属到用户账本。
- 金额在数据库中使用 `numeric(12,2)`，前端提交前统一校验两位小数。
- 删除交易使用软删除，不直接物理删除。
- 资金渠道和分类标签支持隐藏，不直接硬删除已被交易引用的数据。
- 每个用户的默认账本初始化一份自己的资金渠道和分类标签。
- 不使用全局共享的系统默认渠道或标签，避免用户隐藏、编辑默认项时需要额外覆盖表。

### 3.2 profiles

用户资料表，与 Supabase Auth 用户一一对应。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | uuid | primary key, references auth.users(id) | 用户 ID |
| phone | text | nullable | 手机号，来自 Auth 用户信息 |
| display_name | text | nullable | 昵称 |
| avatar_url | text | nullable | 头像 URL |
| created_at | timestamptz | not null, default now() | 创建时间 |
| updated_at | timestamptz | not null, default now() | 更新时间 |

### 3.3 ledgers

账本表。MVP 每个用户默认一个账本，但保留未来多账本扩展能力。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | uuid | primary key, default gen_random_uuid() | 账本 ID |
| name | text | not null | 账本名称 |
| description | text | nullable | 账本描述 |
| currency | text | not null, default 'CNY' | 默认币种 |
| created_by | uuid | not null, references auth.users(id) | 创建人 |
| is_default | boolean | not null, default false | 是否默认账本 |
| created_at | timestamptz | not null, default now() | 创建时间 |
| updated_at | timestamptz | not null, default now() | 更新时间 |
| archived_at | timestamptz | nullable | 归档时间 |

建议约束：

- 同一用户最多一个默认账本：`unique (created_by) where is_default = true`。

默认账本初始化规则：

- 用户首次登录后，如果不存在默认账本，则自动创建一个默认账本。
- 默认账本名称可使用“我的账本”。
- 创建默认账本后，自动初始化该账本下的默认资金渠道和分类标签。
- 初始化过程必须具备幂等性，避免重复创建默认数据。

默认资金渠道：

- 支付宝。
- 微信。
- 银行卡。
- 现金。
- 其他。

默认支出标签：

- 餐饮。
- 交通。
- 购物。
- 居住。
- 日用。
- 娱乐。
- 医疗。
- 教育。
- 人情。
- 其他。

默认收入标签：

- 工资。
- 奖金。
- 兼职。
- 红包。
- 退款。
- 投资收益。
- 其他。

### 3.4 funding_sources

资金渠道表，例如支付宝、微信、银行卡、现金。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | uuid | primary key, default gen_random_uuid() | 资金渠道 ID |
| ledger_id | uuid | not null, references ledgers(id) | 账本 ID |
| name | text | not null | 渠道名称 |
| icon | text | nullable | 图标标识 |
| color | text | nullable | 颜色 |
| created_by | uuid | not null, references auth.users(id) | 创建人 |
| created_at | timestamptz | not null, default now() | 创建时间 |
| updated_at | timestamptz | not null, default now() | 更新时间 |
| hidden_at | timestamptz | nullable | 隐藏时间 |

建议约束：

- 同一账本下资金渠道名称不重复。

### 3.5 category_tags

分类标签表，例如餐饮、教育、工资、红包。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | uuid | primary key, default gen_random_uuid() | 分类标签 ID |
| ledger_id | uuid | not null, references ledgers(id) | 账本 ID |
| name | text | not null | 标签名称 |
| type | text | not null | `expense` 或 `income` |
| icon | text | nullable | 图标标识 |
| color | text | nullable | 颜色 |
| created_by | uuid | not null, references auth.users(id) | 创建人 |
| created_at | timestamptz | not null, default now() | 创建时间 |
| updated_at | timestamptz | not null, default now() | 更新时间 |
| hidden_at | timestamptz | nullable | 隐藏时间 |

建议约束：

- `type in ('expense', 'income')`。
- 同一账本下相同类型的分类标签名称不重复。

### 3.6 transactions

交易表。每条记录表示一笔收入或支出。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | uuid | primary key, default gen_random_uuid() | 交易 ID |
| ledger_id | uuid | not null, references ledgers(id) | 账本 ID |
| type | text | not null | `expense` 或 `income` |
| amount | numeric(12,2) | not null | 金额 |
| currency | text | not null, default 'CNY' | 币种 |
| funding_source_id | uuid | not null, references funding_sources(id) | 资金渠道 |
| category_tag_id | uuid | not null, references category_tags(id) | 分类标签，每笔交易仅一个 |
| transaction_date | date | not null | 交易日期 |
| note | text | nullable | 备注 |
| created_by | uuid | not null, references auth.users(id) | 创建人 |
| created_at | timestamptz | not null, default now() | 创建时间 |
| updated_at | timestamptz | not null, default now() | 更新时间 |
| deleted_at | timestamptz | nullable | 软删除时间 |

建议约束：

- `type in ('expense', 'income')`。
- `amount > 0`。
- `category_tag_id` 对应标签类型必须与交易 `type` 一致。该规则建议通过写入逻辑和数据库触发器双重保证。

## 4. RLS 权限策略

### 4.1 权限原则

- 所有核心业务表开启 Row Level Security。
- 用户只能访问自己的 `profiles` 记录。
- 用户只能访问 `created_by = auth.uid()` 的账本。
- 用户只能访问自己账本下的资金渠道、分类标签和交易。
- 前端不能依赖隐藏字段做权限判断，权限必须由 Supabase RLS 兜底。
- 服务端写操作也必须使用当前用户上下文，不能用 service role 绕过普通业务权限。

### 4.2 profiles 策略

读取：

- 用户只能读取 `id = auth.uid()` 的资料。

新增：

- 用户只能为自己创建 `id = auth.uid()` 的资料。

更新：

- 用户只能更新 `id = auth.uid()` 的资料。

删除：

- MVP 不提供删除 profile 能力。

### 4.3 ledgers 策略

读取：

- 用户只能读取 `created_by = auth.uid()` 且 `archived_at is null` 的账本。

新增：

- 用户只能创建 `created_by = auth.uid()` 的账本。

更新：

- 用户只能更新 `created_by = auth.uid()` 的账本。

删除：

- MVP 不物理删除账本。
- 如需停用账本，使用 `archived_at` 归档。

### 4.4 funding_sources 策略

读取：

- 用户只能读取所属账本 `created_by = auth.uid()` 的资金渠道。

新增：

- 用户只能在自己的账本下创建资金渠道。
- `created_by` 必须等于 `auth.uid()`。

更新：

- 用户只能更新自己账本下的资金渠道。
- 隐藏资金渠道通过设置 `hidden_at` 实现。

删除：

- MVP 不提供硬删除资金渠道能力。

### 4.5 category_tags 策略

读取：

- 用户只能读取所属账本 `created_by = auth.uid()` 的分类标签。

新增：

- 用户只能在自己的账本下创建分类标签。
- `created_by` 必须等于 `auth.uid()`。

更新：

- 用户只能更新自己账本下的分类标签。
- 隐藏分类标签通过设置 `hidden_at` 实现。

删除：

- MVP 不提供硬删除分类标签能力。

### 4.6 transactions 策略

读取：

- 用户只能读取所属账本 `created_by = auth.uid()` 的交易。
- 默认查询应过滤 `deleted_at is null`。

新增：

- 用户只能在自己的账本下创建交易。
- `created_by` 必须等于 `auth.uid()`。
- `funding_source_id` 必须属于同一账本。
- `category_tag_id` 必须属于同一账本。

更新：

- 用户只能更新自己账本下的交易。
- 软删除交易通过设置 `deleted_at` 实现。

删除：

- MVP 不提供硬删除交易能力。

### 4.7 业务校验与 RLS 的边界

RLS 负责数据归属隔离，以下业务规则由 Server Actions 或数据库约束补充：

- 金额必须大于 0。
- 交易类型只能是 `income` 或 `expense`。
- 分类标签类型必须与交易类型一致。
- 资金渠道和分类标签必须属于同一个账本。
- 隐藏的资金渠道和分类标签不应出现在新增交易选项中，但历史交易仍可读取。

## 5. Auth 登录方案

### 5.1 登录方式

- 使用 Supabase Auth 的手机号 + 密码能力。
- 用户使用手机号作为账号标识。
- 用户注册时自定义密码。
- MVP 不使用短信验证码登录。
- MVP 不接入短信服务商。
- Supabase 手机号确认能力不作为 MVP 必需能力。

参考依据：

- Supabase 官方文档支持通过手机号和密码注册：`supabase.auth.signUp({ phone, password })`。
- Supabase 官方文档支持通过手机号和密码登录：`supabase.auth.signInWithPassword({ phone, password })`。

### 5.2 手机号格式

- 前端要求用户输入手机号。
- 提交给 Supabase Auth 前应转换为 E.164 格式。
- 中国大陆手机号示例：`13800138000` 转换为 `+8613800138000`。
- MVP 默认面向中国大陆手机号。

### 5.3 注册流程

流程：

1. 用户输入手机号。
2. 用户输入密码。
3. 用户确认密码。
4. 前端校验手机号和密码强度。
5. 调用 Supabase `signUp({ phone, password })`。
6. 注册成功后创建或补全 `profiles`。
7. 初始化默认账本、资金渠道和分类标签。
8. 跳转到首页 `/`。

密码要求：

- 最少 8 位。
- 至少包含字母和数字。
- 前后空格自动去除。

### 5.4 登录流程

流程：

1. 用户输入手机号。
2. 用户输入密码。
3. 前端转换手机号为 E.164 格式。
4. 调用 Supabase `signInWithPassword({ phone, password })`。
5. 登录成功后检查默认账本是否存在。
6. 如果默认账本不存在，则执行幂等初始化。
7. 跳转到首页 `/`。

### 5.5 Session 管理

- 使用 Supabase SSR 方案在 Next.js App Router 中管理 session。
- Middleware 负责保护业务路由。
- Server Components 通过服务端 Supabase client 获取当前用户。
- Client Components 仅处理登录、注册、退出等交互。

### 5.6 退出登录

- 用户在设置页点击退出登录。
- 调用 Supabase `signOut()`。
- 清理本地 session 后跳转到 `/login`。

### 5.7 密码找回

MVP 暂不实现密码找回。

原因：

- 不接入短信服务时，手机号账号缺少自动找回密码通道。
- 后续如需要密码找回，应接入短信服务或增加邮箱绑定。

MVP 替代方案：

- 开发或个人部署阶段可通过 Supabase 控制台手动重置用户密码。

## 6. PWA 配置方案

### 6.1 MVP 范围

第一版只实现基础 PWA 能力：

- 支持添加到手机主屏幕。
- 提供应用名称、短名称、图标和主题色。
- 使用独立窗口模式打开。
- 缓存基础静态资源。
- 弱网或离线时展示友好提示。

第一版不实现：

- 离线新增交易。
- 离线编辑交易。
- 离线删除交易。
- 网络恢复后的自动同步。
- 本地数据冲突处理。

### 6.2 Manifest

配置 `manifest.webmanifest`。

建议字段：

```json
{
  "name": "Ledger",
  "short_name": "Ledger",
  "description": "个人日常记账应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": []
}
```

图标尺寸建议：

- `192x192`
- `512x512`
- Maskable icon，后续补充。

### 6.3 缓存策略

- 静态资源可以缓存，例如 JS、CSS、字体、图标。
- 业务 API 和 Supabase 数据请求不做激进缓存。
- 交易、资金渠道、分类标签和统计数据以在线实时查询为准。
- 避免用户看到过期账目数据。

### 6.4 弱网与离线提示

- 客户端监听网络状态。
- 离线时提示“当前网络不可用，记账数据需要联网后操作”。
- 表单提交失败时保留用户当前输入，避免数据丢失。

### 6.5 实现方式

- 可使用 `next-pwa` 或 Workbox 方案。
- 若所选方案与当前 Next.js 版本兼容性不足，则优先保留 manifest 和基础安装能力，缓存策略后续补充。

## 7. 核心业务逻辑

### 7.1 交易写入

- 新增和编辑交易通过 Server Actions 或 Route Handlers 执行。
- 客户端表单使用 React Hook Form + Zod 做提交前校验。
- 服务端必须再次执行等价校验，不能信任客户端输入。
- 写入时必须校验资金渠道和分类标签属于当前用户的账本。
- 写入时必须校验分类标签类型与交易类型一致。

### 7.2 交易列表

- 交易列表由服务端读取。
- 默认只查询 `deleted_at is null` 的交易。
- 支持按月份、交易类型、资金渠道和分类标签筛选。
- 列表按 `transaction_date desc, created_at desc` 排序。
- 数据量较大时使用分页或按月加载。

### 7.3 统计聚合

MVP 统计逻辑由 Next.js 服务端完成。

原则：

- 不在浏览器端拉取全量交易再计算统计。
- 暂不使用 materialized view。
- 暂不要求使用 Supabase RPC。
- Server Component 或服务端函数从 Supabase 查询当前用户账本下的交易数据，并在服务端聚合后返回页面所需结构。

统计范围：

- 月度总收入。
- 月度总支出。
- 月度结余。
- 按资金渠道汇总收入和支出。
- 按分类标签汇总收入和支出。
- 按日期汇总收入和支出趋势。

基础计算规则：

- 只统计 `deleted_at is null` 的交易。
- `income` 累加到收入。
- `expense` 累加到支出。
- 月度结余 = 月度收入 - 月度支出。
- 查询范围默认使用当前自然月。
- 统计页允许切换月份。

### 7.4 初始化逻辑

用户登录或注册成功后执行幂等初始化：

1. 检查用户 profile 是否存在，不存在则创建。
2. 检查默认账本是否存在，不存在则创建。
3. 检查默认资金渠道是否存在，不存在则创建。
4. 检查默认收入和支出分类标签是否存在，不存在则创建。

初始化逻辑必须可以重复执行，重复执行不得产生重复数据。

### 7.5 隐藏逻辑

- 资金渠道隐藏时设置 `hidden_at`。
- 分类标签隐藏时设置 `hidden_at`。
- 新增和编辑交易时默认只展示 `hidden_at is null` 的渠道和标签。
- 历史交易详情和统计仍应能展示隐藏渠道和隐藏标签名称。

## 8. 部署与环境变量

### 8.1 部署架构

- Next.js 应用部署到 Vercel。
- Supabase 使用云端项目承载 Auth、PostgreSQL 和 RLS。
- 代码仓库使用 GitHub。
- GitHub 仓库连接 Vercel。
- `main` 分支自动部署 Production。
- 非 `main` 分支或 Pull Request 使用 Vercel Preview Deployment。

### 8.2 环境变量

本地开发使用 `.env.local`。

Vercel 环境变量需要分别配置 Production 和 Preview。

必需变量：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

可选服务端变量：

```env
SUPABASE_SERVICE_ROLE_KEY=
```

使用原则：

- `NEXT_PUBLIC_SUPABASE_URL` 可暴露到浏览器。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 可暴露到浏览器，但必须配合 RLS 使用。
- `SUPABASE_SERVICE_ROLE_KEY` 只能在服务端使用。
- 普通业务读写不应使用 service role key 绕过 RLS。
- 如果 MVP 不需要管理型后台任务，可以暂不配置 service role key。

### 8.3 Supabase Migration

数据库结构变更必须通过 migration 文件管理。

原则：

- 不只在 Supabase 控制台手动改表。
- migration 文件纳入 Git 版本控制。
- 表结构、索引、约束、触发器和 RLS policy 都应通过 migration 创建。
- 本地开发、Preview 和 Production 应使用同一套 migration。

建议目录：

```text
supabase/
  migrations/
```

### 8.4 发布流程

推荐流程：

1. 本地开发并创建 migration。
2. 本地验证 schema 和应用功能。
3. 推送分支到 GitHub。
4. Vercel 生成 Preview Deployment。
5. 在 Supabase 测试或预览环境应用 migration。
6. 验证 Preview 环境。
7. 合并到 `main`。
8. 对 Production Supabase 应用 migration。
9. Vercel 自动发布 Production。

### 8.5 部署注意事项

- Production 和 Preview 应使用不同 Supabase 项目或至少不同数据库环境，避免测试数据污染生产。
- Auth 配置中的 Site URL 需要指向生产域名。
- Redirect URL 需要包含 Vercel Preview 域名模式或指定预览域名。
- 由于 MVP 使用手机号 + 密码且不接入短信服务，需要在 Supabase Auth 中启用 phone/password，并关闭必须短信确认的要求。

## 9. 测试与验收

### 9.1 测试范围

MVP 测试重点覆盖：

- 表单校验。
- RLS 权限。
- 核心业务规则。
- 统计计算。
- PWA 基础能力。
- 部署环境。

### 9.2 表单校验测试

需要验证：

- 手机号为空时不能提交。
- 手机号格式不正确时不能提交。
- 密码为空时不能提交。
- 密码不满足强度要求时不能注册。
- 金额为空时不能提交。
- 金额小于或等于 0 时不能提交。
- 未选择资金渠道时不能提交。
- 未选择分类标签时不能提交。
- 备注为空时允许提交。

### 9.3 RLS 权限测试

需要验证：

- 未登录用户不能读取任何业务数据。
- 用户 A 不能读取用户 B 的账本。
- 用户 A 不能读取用户 B 的资金渠道。
- 用户 A 不能读取用户 B 的分类标签。
- 用户 A 不能读取用户 B 的交易。
- 用户 A 不能在用户 B 的账本下创建交易。
- 用户 A 不能更新或隐藏用户 B 的资金渠道和分类标签。

### 9.4 业务规则测试

需要验证：

- 新用户首次登录后会自动创建默认账本。
- 新用户首次登录后会自动创建默认资金渠道。
- 新用户首次登录后会自动创建默认收入和支出分类标签。
- 初始化逻辑重复执行不会创建重复数据。
- 收入交易只能选择收入类型分类标签。
- 支出交易只能选择支出类型分类标签。
- 每笔交易只能关联一个分类标签。
- 隐藏资金渠道后，新增交易默认选项不再展示该渠道。
- 隐藏分类标签后，新增交易默认选项不再展示该标签。
- 历史交易仍能显示被隐藏的资金渠道和分类标签。
- 软删除交易后，该交易不再出现在默认列表和统计中。

### 9.5 统计测试

需要验证：

- 月度总收入计算正确。
- 月度总支出计算正确。
- 月度结余 = 月度收入 - 月度支出。
- 按资金渠道汇总收入和支出正确。
- 按分类标签汇总收入和支出正确。
- 按日期汇总趋势正确。
- 已软删除交易不参与统计。
- 切换月份后统计范围正确。

### 9.6 PWA 验收

需要验证：

- 应用可以添加到手机主屏幕。
- 主屏幕图标和应用名称展示正常。
- 应用以 standalone 模式打开。
- 主题色配置生效。
- 弱网或离线时展示提示。
- 离线状态下不会误导用户以为交易已提交成功。

### 9.7 部署验收

需要验证：

- Vercel Production 环境可正常访问。
- Vercel Preview 环境可正常访问。
- Supabase URL 和 anon key 配置正确。
- RLS 在部署环境生效。
- migration 已正确应用到目标 Supabase 环境。
- 手机号 + 密码注册和登录在部署环境可用。

## 10. 开发任务拆分

### 10.1 开发顺序

推荐按以下顺序开发：

1. 初始化 Next.js 项目和基础依赖。
2. 配置 Tailwind CSS、shadcn/ui 和基础布局。
3. 配置 Supabase client、SSR session 和环境变量。
4. 创建 Supabase migration。
5. 实现 Auth 注册、登录和退出。
6. 实现默认账本和默认数据初始化。
7. 实现交易新增、编辑和软删除。
8. 实现资金渠道管理。
9. 实现分类标签管理。
10. 实现首页和交易列表。
11. 实现统计页。
12. 实现 PWA 基础能力。
13. 执行权限、统计、PWA 和部署验收。

### 10.2 任务细分

#### 阶段 1：项目基础

- 初始化 Next.js App Router 项目。
- 启用 TypeScript。
- 安装并配置 Tailwind CSS。
- 安装并配置 shadcn/ui。
- 安装 Supabase 客户端依赖。
- 安装 React Hook Form 和 Zod。
- 配置基础目录结构。

#### 阶段 2：数据库与权限

- 创建 `profiles` migration。
- 创建 `ledgers` migration。
- 创建 `funding_sources` migration。
- 创建 `category_tags` migration。
- 创建 `transactions` migration。
- 创建必要索引和约束。
- 创建 RLS policies。
- 验证用户间数据隔离。

#### 阶段 3：认证与初始化

- 实现手机号 + 密码注册。
- 实现手机号 + 密码登录。
- 实现退出登录。
- 实现手机号 E.164 格式转换。
- 实现 session middleware。
- 实现默认 profile 初始化。
- 实现默认账本初始化。
- 实现默认资金渠道和分类标签初始化。

#### 阶段 4：核心记账

- 实现新增交易页面。
- 实现编辑交易页面。
- 实现交易软删除。
- 实现交易列表查询。
- 实现月份、类型、资金渠道和分类标签筛选。
- 实现交易表单 Zod schema。
- 实现收入/支出与分类标签类型匹配校验。

#### 阶段 5：配置管理

- 实现资金渠道列表。
- 实现新增资金渠道。
- 实现编辑资金渠道。
- 实现隐藏资金渠道。
- 实现分类标签列表。
- 实现新增分类标签。
- 实现编辑分类标签。
- 实现隐藏分类标签。

#### 阶段 6：统计与首页

- 实现首页本月收入、支出、结余。
- 实现最近交易列表。
- 实现资金渠道汇总。
- 实现分类标签汇总。
- 实现统计页月份切换。
- 实现按日期收支趋势。

#### 阶段 7：PWA 与部署

- 添加 `manifest.webmanifest`。
- 添加 App 图标。
- 配置主题色。
- 配置基础静态资源缓存。
- 实现弱网或离线提示。
- 配置 Vercel 环境变量。
- 配置 Supabase 生产环境。
- 应用 migration。
- 完成 Production 部署验收。

### 10.3 MVP 完成标准

满足以下条件后，MVP 可视为完成：

- 用户可以通过手机号 + 密码注册和登录。
- 用户首次登录后自动拥有默认账本、资金渠道和分类标签。
- 用户可以新增、编辑和软删除收入或支出交易。
- 用户可以管理自定义资金渠道和分类标签。
- 用户可以查看首页概览、交易列表和统计页。
- 用户只能访问自己的账本数据。
- PWA 可以添加到手机主屏幕。
- 应用可以通过 Vercel Production 正常访问。
