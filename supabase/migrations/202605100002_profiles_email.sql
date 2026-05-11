alter table public.profiles
  add column if not exists email text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'account'
  ) then
    execute 'update public.profiles set email = account where email is null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'phone'
  ) then
    execute 'update public.profiles set email = phone where email is null';
  end if;
end;
$$;

drop index if exists public.profiles_unique_account;

create unique index if not exists profiles_unique_email
  on public.profiles(lower(email))
  where email is not null;
