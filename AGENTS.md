<!-- BEGIN:nextjs-agent-rules -->
# 这不是你记忆中的 Next.js

当前项目使用的 Next.js 版本可能包含破坏性变化，API、约定和文件结构都可能不同于模型训练数据中的旧版本。

在编写或修改 Next.js 相关代码前，应优先阅读 `node_modules/next/dist/docs/` 中的相关文档，并遵守当前版本的弃用提示和推荐写法。
<!-- END:nextjs-agent-rules -->

# Ledger 项目 Agent 指南

## 语言要求

- 本项目的文档、代码注释、提交说明建议、界面文案和错误提示默认使用中文。
- 与用户沟通时默认使用中文。
- 只有在库 API、配置字段、命令、文件名、类型名、变量名或业界通用术语必须使用英文时，才保留英文。
- 代码注释应解释业务意图或复杂逻辑，不要添加重复代码表面含义的低价值注释。

## 项目背景

Ledger 是一个个人日常记账 PWA。

MVP 支持：

- 邮箱 + 密码注册和登录。
- 每个用户一个默认个人账本。
- 收入和支出交易。
- 每笔交易选择一个资金渠道。
- 每笔交易选择一个分类标签。
- 用户自定义资金渠道。
- 用户自定义分类标签。
- 服务端统计月度收入、月度支出、月度结余、资金渠道汇总、分类标签汇总和每日趋势。

MVP 不支持：

- 多人账本。
- 账户余额管理。
- 预算管理。
- 分账或结算。
- 离线新增交易或离线同步。

## 项目文档

修改产品或架构前，应先阅读：

- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/TECHNICAL_DESIGN.md`
- `docs/PROJECT_PROGRESS.md`

编写或修改界面前，应先阅读：

- `DESIGN.md`

如果实现需要偏离上述文档，必须在同一次变更中更新对应文档，避免代码和文档脱节。

每完成一个任务，都必须更新 `docs/PROJECT_PROGRESS.md`，记录完成内容、验证结果和下一步建议。

## 技术栈

- Next.js App Router。
- TypeScript。
- Tailwind CSS。
- shadcn/ui。
- React Hook Form。
- Zod。
- Supabase Auth。
- Supabase PostgreSQL。
- Supabase RLS。
- pnpm。
- Vercel。

## 编码约定

- 使用 `src/app` 下的 App Router 约定。
- 初始数据读取优先使用 Server Components。
- 表单、筛选器、图表、弹窗和用户触发的交互逻辑使用 Client Components。
- 写操作优先使用 Server Actions 或 Route Handlers。
- 表单输入使用 Zod 校验；服务端写入路径必须执行等价校验。
- 所有用户数据访问必须基于当前 Supabase session。
- 普通业务读写不得使用 `SUPABASE_SERVICE_ROLE_KEY` 绕过 RLS。
- 交易删除使用 `deleted_at` 软删除。
- 资金渠道和分类标签隐藏使用 `hidden_at`。
- 删除资金渠道前必须检查是否有交易引用；已被使用的资金渠道只能隐藏，未被使用的资金渠道可以删除。
- 删除分类标签前必须把使用该标签的交易迁移到同类型“其他”标签，再删除原标签。
- 不引入运行时依赖 Google Fonts 的字体方案，构建不应依赖访问 Google Fonts。

## 数据模型规则

- MVP 阶段每个用户有一个默认账本。
- 每个账本拥有自己的资金渠道、分类标签和交易。
- 资金渠道和分类标签是用户账本内的数据，不使用全局共享默认记录。
- 交易类型只能是 `income` 或 `expense`。
- 交易金额必须大于 0。
- 每笔交易必须且只能关联一个 `funding_source_id`。
- 每笔交易必须且只能关联一个 `category_tag_id`。
- 分类标签类型必须和交易类型一致。
- 被隐藏的资金渠道和分类标签仍必须能在历史交易中正常展示。

## 默认初始化数据

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

## 验证命令

相关变更完成后运行：

```bash
pnpm lint
pnpm build
```

如果 `pnpm build` 在受限沙箱中因为 Turbopack 绑定端口权限失败，应使用合适的执行权限重新运行构建，不要为此修改应用代码。

## Git 约定

- GitHub remote 是 `https://github.com/tototi5997/ledger.git`。
- 未经用户明确要求，不要提交 commit。
- 未经用户明确要求，不要 push。
- 未经用户明确要求，不要改写 Git 历史。
