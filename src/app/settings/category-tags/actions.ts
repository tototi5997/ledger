"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUserOrRedirect, getDefaultLedgerId } from "@/lib/ledger/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { categoryTagIdSchema, categoryTagSchema } from "@/lib/validations/category-tag"

export type CategoryTagActionState = {
  message: string
}

const fallbackMessage = "操作失败，请稍后重试"

export async function createCategoryTagAction(
  _previousState: CategoryTagActionState,
  formData: FormData
): Promise<CategoryTagActionState> {
  const parsed = categoryTagSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  })

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { error } = await supabase.from("category_tags").insert({
    ledger_id: ledgerId,
    name: parsed.data.name,
    type: parsed.data.type,
    created_by: user.id,
  })

  if (error) {
    if (error.code === "23505") {
      return { message: "该分类标签已存在" }
    }

    return { message: error.message || fallbackMessage }
  }

  revalidateCategoryTagPages()

  return { message: "" }
}

export async function updateCategoryTagAction(
  _previousState: CategoryTagActionState,
  formData: FormData
): Promise<CategoryTagActionState> {
  const idParsed = categoryTagIdSchema.safeParse(formData.get("id"))
  const bodyParsed = categoryTagSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  })

  if (!idParsed.success) {
    return { message: idParsed.error.issues[0]?.message ?? fallbackMessage }
  }

  if (!bodyParsed.success) {
    return { message: bodyParsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("ledger_id", ledgerId)
    .eq("category_tag_id", idParsed.data)

  if (countError) {
    return { message: countError.message || fallbackMessage }
  }

  if ((count ?? 0) > 0) {
    const { data: currentTag, error: currentTagError } = await supabase
      .from("category_tags")
      .select("type")
      .eq("id", idParsed.data)
      .eq("ledger_id", ledgerId)
      .maybeSingle()

    if (currentTagError || !currentTag) {
      return { message: "分类标签不存在或无权访问" }
    }

    if (currentTag.type !== bodyParsed.data.type) {
      return { message: "已被交易使用的分类标签不能修改类型" }
    }
  }

  const { error } = await supabase
    .from("category_tags")
    .update({
      name: bodyParsed.data.name,
      type: bodyParsed.data.type,
      hidden_at: null,
    })
    .eq("id", idParsed.data)
    .eq("ledger_id", ledgerId)

  if (error) {
    if (error.code === "23505") {
      return { message: "该分类标签已存在" }
    }

    return { message: error.message || fallbackMessage }
  }

  revalidateCategoryTagPages()

  return { message: "" }
}

export async function hideCategoryTagAction(formData: FormData) {
  const parsed = categoryTagIdSchema.safeParse(formData.get("id"))

  if (!parsed.success) {
    return
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)

  await supabase
    .from("category_tags")
    .update({
      hidden_at: new Date().toISOString(),
    })
    .eq("id", parsed.data)
    .eq("ledger_id", ledgerId)

  revalidateCategoryTagPages()
}

export async function deleteCategoryTagAction(
  _previousState: CategoryTagActionState,
  formData: FormData
): Promise<CategoryTagActionState> {
  const parsed = categoryTagIdSchema.safeParse(formData.get("id"))

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? fallbackMessage }
  }

  const supabase = await createSupabaseServerClient()
  const user = await getCurrentUserOrRedirect(supabase)
  const ledgerId = await getDefaultLedgerId(supabase, user)
  const { data: tag, error: tagError } = await supabase
    .from("category_tags")
    .select("id,name,type")
    .eq("id", parsed.data)
    .eq("ledger_id", ledgerId)
    .maybeSingle()

  if (tagError || !tag) {
    return { message: "分类标签不存在或无权访问" }
  }

  const fallbackTagId = await ensureOtherTag(supabase, {
    ledgerId,
    userId: user.id,
    type: tag.type,
    deletingTagId: tag.id,
  })

  if (!fallbackTagId) {
    return { message: "无法找到或创建同类型的“其他”标签" }
  }

  const { error: migrateError } = await supabase
    .from("transactions")
    .update({
      category_tag_id: fallbackTagId,
    })
    .eq("ledger_id", ledgerId)
    .eq("category_tag_id", tag.id)

  if (migrateError) {
    return { message: migrateError.message || fallbackMessage }
  }

  const { error } = await supabase
    .from("category_tags")
    .delete()
    .eq("id", tag.id)
    .eq("ledger_id", ledgerId)

  if (error) {
    return { message: error.message || fallbackMessage }
  }

  revalidateCategoryTagPages()

  return { message: "" }
}

async function ensureOtherTag(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  {
    ledgerId,
    userId,
    type,
    deletingTagId,
  }: {
    ledgerId: string
    userId: string
    type: "expense" | "income"
    deletingTagId: string
  }
) {
  const { data: existingOtherTag, error: queryError } = await supabase
    .from("category_tags")
    .select("id")
    .eq("ledger_id", ledgerId)
    .eq("type", type)
    .eq("name", "其他")
    .neq("id", deletingTagId)
    .maybeSingle()

  if (queryError) {
    throw queryError
  }

  if (existingOtherTag) {
    return existingOtherTag.id
  }

  const { data: createdOtherTag, error: createError } = await supabase
    .from("category_tags")
    .insert({
      ledger_id: ledgerId,
      name: "其他",
      type,
      created_by: userId,
    })
    .select("id")
    .single()

  if (createError) {
    throw createError
  }

  return createdOtherTag.id
}

function revalidateCategoryTagPages() {
  revalidatePath("/settings")
  revalidatePath("/settings/category-tags")
  revalidatePath("/transactions/new")
  revalidatePath("/transactions")
  revalidatePath("/")
  revalidatePath("/analytics")
}
