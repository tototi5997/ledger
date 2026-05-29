import { readFileSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import pg from "pg"

const { Client } = pg
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const migrationsDir = path.join(rootDir, "supabase", "migrations")
const migrationTableSql = `
create table if not exists public.schema_migrations (
  version text primary key,
  name text not null,
  applied_at timestamptz not null default now()
);
`

loadEnvFile(path.join(rootDir, ".env.local"))
loadEnvFile(path.join(rootDir, ".env"))

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL

if (!connectionString) {
  console.error(
    [
      "缺少数据库连接串，无法执行 migration。",
      "请在 .env.local 中配置 DATABASE_URL 或 DIRECT_URL。",
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 只能访问 API，不能执行 DDL migration。",
    ].join("\n")
  )
  process.exit(1)
}

const client = new Client({
  connectionString,
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
})

try {
  await client.connect()
  await client.query(migrationTableSql)

  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort()
  await markLegacyMigrationsAsApplied(migrationFiles)
  const appliedVersions = await getAppliedVersions()
  let appliedCount = 0

  for (const file of migrationFiles) {
    const version = file.replace(/\.sql$/, "")

    if (appliedVersions.has(version)) {
      continue
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8")
    console.log(`执行 migration: ${file}`)
    await client.query("begin")

    try {
      await client.query(sql)
      await client.query(
        "insert into public.schema_migrations(version, name) values ($1, $2)",
        [version, file]
      )
      await client.query("commit")
      appliedCount += 1
    } catch (error) {
      await client.query("rollback")
      throw error
    }
  }

  if (appliedCount === 0) {
    console.log("数据库 migration 已是最新。")
  } else {
    console.log(`数据库 migration 完成，本次执行 ${appliedCount} 个文件。`)
  }
} finally {
  await client.end().catch(() => {})
}

async function getAppliedVersions() {
  const { rows } = await client.query("select version from public.schema_migrations")

  return new Set(rows.map((row) => row.version))
}

async function markLegacyMigrationsAsApplied(migrationFiles) {
  const { rows } = await client.query(`
    select
      to_regclass('public.profiles') is not null as has_profiles,
      to_regclass('public.ledgers') is not null as has_ledgers,
      to_regclass('public.funding_sources') is not null as has_funding_sources,
      to_regclass('public.category_tags') is not null as has_category_tags,
      to_regclass('public.transactions') is not null as has_transactions,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'email'
      ) as has_profiles_email,
      exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'funding_sources'
          and policyname = '用户只能删除自己账本且未被交易使用的资金渠道'
      ) as has_funding_source_delete_policy,
      exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'category_tags'
          and policyname = '用户只能删除自己账本的分类标签'
      ) as has_category_tag_delete_policy,
      to_regclass('public.funding_source_balance_snapshots') is not null as has_asset_snapshots,
      exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'funding_sources'
          and policyname = '用户只能删除自己账本且未被交易或余额快照使用的资金渠道'
      ) as has_asset_funding_source_delete_policy
  `)
  const state = rows[0]
  const legacyVersions = new Set()

  if (
    state.has_profiles &&
    state.has_ledgers &&
    state.has_funding_sources &&
    state.has_category_tags &&
    state.has_transactions
  ) {
    legacyVersions.add("202605100001_initial_schema")
  }

  if (state.has_profiles_email) {
    legacyVersions.add("202605100002_profiles_email")
  }

  if (
    state.has_funding_source_delete_policy ||
    state.has_asset_funding_source_delete_policy
  ) {
    legacyVersions.add("202605100003_funding_sources_delete_policy")
  }

  if (state.has_category_tag_delete_policy) {
    legacyVersions.add("202605110001_category_tags_delete_policy")
  }

  if (state.has_asset_snapshots && state.has_asset_funding_source_delete_policy) {
    legacyVersions.add("202605290001_asset_balance_snapshots")
  }

  const legacyFiles = migrationFiles.filter((file) =>
    legacyVersions.has(file.replace(/\.sql$/, ""))
  )

  let insertedCount = 0

  for (const file of legacyFiles) {
    const version = file.replace(/\.sql$/, "")
    const result = await client.query(
      "insert into public.schema_migrations(version, name) values ($1, $2) on conflict do nothing",
      [version, file]
    )
    insertedCount += result.rowCount ?? 0
  }

  if (insertedCount > 0) {
    console.log(`已接管 ${insertedCount} 个既有 migration 记录。`)
  }
}

function shouldUseSsl(connectionString) {
  const url = new URL(connectionString)
  const sslMode = url.searchParams.get("sslmode")

  if (sslMode === "disable") {
    return false
  }

  return !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
}

function loadEnvFile(filePath) {
  let content

  try {
    content = readFileSync(filePath, "utf8")
  } catch {
    return
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue
    }

    const [key, ...valueParts] = line.split("=")
    const trimmedKey = key.trim()

    if (!trimmedKey || process.env[trimmedKey] !== undefined) {
      continue
    }

    process.env[trimmedKey] = parseEnvValue(valueParts.join("=").trim())
  }
}

function parseEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
