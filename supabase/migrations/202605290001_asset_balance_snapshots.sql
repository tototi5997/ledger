create table if not exists public.funding_source_balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  funding_source_id uuid not null references public.funding_sources(id) on delete cascade,
  balance_amount numeric(12, 2) not null check (balance_amount >= 0),
  currency text not null default 'CNY',
  snapshot_date date not null check (snapshot_date <= current_date),
  note text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists funding_source_balance_snapshots_one_active_per_day
  on public.funding_source_balance_snapshots(funding_source_id, snapshot_date)
  where deleted_at is null;

create index if not exists funding_source_balance_snapshots_source_date_idx
  on public.funding_source_balance_snapshots(ledger_id, funding_source_id, snapshot_date desc)
  where deleted_at is null;

create index if not exists funding_source_balance_snapshots_ledger_date_idx
  on public.funding_source_balance_snapshots(ledger_id, snapshot_date desc)
  where deleted_at is null;

drop trigger if exists funding_source_balance_snapshots_set_updated_at
  on public.funding_source_balance_snapshots;

create trigger funding_source_balance_snapshots_set_updated_at
  before update on public.funding_source_balance_snapshots
  for each row execute function public.set_updated_at();

create or replace function public.validate_funding_source_balance_snapshot()
returns trigger
language plpgsql
as $$
declare
  source_ledger_id uuid;
begin
  select ledger_id into source_ledger_id
  from public.funding_sources
  where id = new.funding_source_id;

  if source_ledger_id is null or source_ledger_id <> new.ledger_id then
    raise exception '资金渠道必须属于同一个账本';
  end if;

  return new;
end;
$$;

drop trigger if exists funding_source_balance_snapshots_validate_relations
  on public.funding_source_balance_snapshots;

create trigger funding_source_balance_snapshots_validate_relations
  before insert or update on public.funding_source_balance_snapshots
  for each row execute function public.validate_funding_source_balance_snapshot();

alter table public.funding_source_balance_snapshots enable row level security;

drop policy if exists "用户只能读取自己账本的余额快照"
  on public.funding_source_balance_snapshots;

create policy "用户只能读取自己账本的余额快照"
  on public.funding_source_balance_snapshots for select
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = funding_source_balance_snapshots.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

drop policy if exists "用户只能创建自己账本的余额快照"
  on public.funding_source_balance_snapshots;

create policy "用户只能创建自己账本的余额快照"
  on public.funding_source_balance_snapshots for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = funding_source_balance_snapshots.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

drop policy if exists "用户只能更新自己账本的余额快照"
  on public.funding_source_balance_snapshots;

create policy "用户只能更新自己账本的余额快照"
  on public.funding_source_balance_snapshots for update
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = funding_source_balance_snapshots.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = funding_source_balance_snapshots.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

drop policy if exists "用户只能删除自己账本且未被交易使用的资金渠道"
  on public.funding_sources;

drop policy if exists "用户只能删除自己账本且未被交易或余额快照使用的资金渠道"
  on public.funding_sources;

create policy "用户只能删除自己账本且未被交易或余额快照使用的资金渠道"
  on public.funding_sources for delete
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = funding_sources.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
    and not exists (
      select 1 from public.transactions
      where transactions.ledger_id = funding_sources.ledger_id
        and transactions.funding_source_id = funding_sources.id
    )
    and not exists (
      select 1 from public.funding_source_balance_snapshots
      where funding_source_balance_snapshots.ledger_id = funding_sources.ledger_id
        and funding_source_balance_snapshots.funding_source_id = funding_sources.id
        and funding_source_balance_snapshots.deleted_at is null
    )
  );
