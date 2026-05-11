create policy "用户只能删除自己账本的分类标签"
  on public.category_tags for delete
  using (
    exists (
      select 1 from public.ledgers
      where ledgers.id = category_tags.ledger_id
        and ledgers.created_by = auth.uid()
        and ledgers.archived_at is null
    )
  );
