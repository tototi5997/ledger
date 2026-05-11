create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_unique_email
  on public.profiles(lower(email))
  where email is not null;

create table public.ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  currency text not null default 'CNY',
  created_by uuid not null references auth.users(id) on delete cascade,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index ledgers_one_default_per_user
  on public.ledgers(created_by)
  where is_default = true;

create table public.funding_sources (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden_at timestamptz
);

create unique index funding_sources_unique_name_per_ledger
  on public.funding_sources(ledger_id, lower(name));

create table public.category_tags (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  icon text,
  color text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden_at timestamptz
);

create unique index category_tags_unique_name_per_ledger_type
  on public.category_tags(ledger_id, type, lower(name));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'CNY',
  funding_source_id uuid not null references public.funding_sources(id),
  category_tag_id uuid not null references public.category_tags(id),
  transaction_date date not null,
  note text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index transactions_ledger_date_idx
  on public.transactions(ledger_id, transaction_date desc, created_at desc)
  where deleted_at is null;

create index transactions_ledger_type_idx
  on public.transactions(ledger_id, type)
  where deleted_at is null;

create index transactions_funding_source_idx
  on public.transactions(funding_source_id)
  where deleted_at is null;

create index transactions_category_tag_idx
  on public.transactions(category_tag_id)
  where deleted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger ledgers_set_updated_at
  before update on public.ledgers
  for each row execute function public.set_updated_at();

create trigger funding_sources_set_updated_at
  before update on public.funding_sources
  for each row execute function public.set_updated_at();

create trigger category_tags_set_updated_at
  before update on public.category_tags
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create or replace function public.validate_transaction_relations()
returns trigger
language plpgsql
as $$
declare
  source_ledger_id uuid;
  tag_ledger_id uuid;
  tag_type text;
begin
  select ledger_id into source_ledger_id
  from public.funding_sources
  where id = new.funding_source_id;

  select ledger_id, type into tag_ledger_id, tag_type
  from public.category_tags
  where id = new.category_tag_id;

  if source_ledger_id is null or source_ledger_id <> new.ledger_id then
    raise exception '资金渠道必须属于同一个账本';
  end if;

  if tag_ledger_id is null or tag_ledger_id <> new.ledger_id then
    raise exception '分类标签必须属于同一个账本';
  end if;

  if tag_type <> new.type then
    raise exception '分类标签类型必须和交易类型一致';
  end if;

  return new;
end;
$$;

create trigger transactions_validate_relations
  before insert or update on public.transactions
  for each row execute function public.validate_transaction_relations();

alter table public.profiles enable row level security;
alter table public.ledgers enable row level security;
alter table public.funding_sources enable row level security;
alter table public.category_tags enable row level security;
alter table public.transactions enable row level security;

create policy "用户只能读取自己的资料"
  on public.profiles for select
  using (id = auth.uid());

create policy "用户只能创建自己的资料"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "用户只能更新自己的资料"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "用户只能读取自己的账本"
  on public.ledgers for select
  using (created_by = auth.uid() and archived_at is null);

create policy "用户只能创建自己的账本"
  on public.ledgers for insert
  with check (created_by = auth.uid());

create policy "用户只能更新自己的账本"
  on public.ledgers for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "用户只能读取自己账本的资金渠道"
  on public.funding_sources for select
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = funding_sources.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能创建自己账本的资金渠道"
  on public.funding_sources for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = funding_sources.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能更新自己账本的资金渠道"
  on public.funding_sources for update
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = funding_sources.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = funding_sources.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能读取自己账本的分类标签"
  on public.category_tags for select
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = category_tags.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能创建自己账本的分类标签"
  on public.category_tags for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = category_tags.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能更新自己账本的分类标签"
  on public.category_tags for update
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = category_tags.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = category_tags.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能读取自己账本的交易"
  on public.transactions for select
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = transactions.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能创建自己账本的交易"
  on public.transactions for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = transactions.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );

create policy "用户只能更新自己账本的交易"
  on public.transactions for update
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = transactions.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.ledgers
      where ledgers.id = transactions.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );
