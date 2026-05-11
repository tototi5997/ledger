create policy "用户只能删除自己账本且未被交易使用的资金渠道"
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
  );
