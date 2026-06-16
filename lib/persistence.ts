import { supabase } from '@/lib/supabase'

/**
 * Single persistence primitive — Invariant 1.
 *
 * Every table-backed entity reads/writes through these helpers.
 * No entity gets its own bespoke save path.
 */

type SyncOptions<T> = {
  /** Primary key column name (default: 'id'). */
  pk?: keyof T & string
  /** Column that scopes rows to a project (e.g. 'project_id'). */
  scopeColumn?: string
  /** The project/scope value to filter by. */
  scopeValue?: string
}

/**
 * Sync a full set of rows: insert new, update existing, delete removed.
 * Keyed on UUID PK. Designed for multi-row entities like `pages` and `mockups`.
 *
 * @param table   - Supabase table name
 * @param rows    - The current full set of rows (DB-shaped, with snake_case keys)
 * @param knownIds - Set of IDs currently in the DB (from the last load or sync)
 * @param options - pk, scopeColumn, scopeValue
 * @returns The updated set of known IDs after sync
 */
export async function syncRows<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  knownIds: Set<string>,
  options: SyncOptions<T> = {},
): Promise<{ knownIds: Set<string>; error: string | null }> {
  const pk = (options.pk ?? 'id') as string

  const currentIds = new Set(rows.map((r) => String(r[pk])))

  // 1. Delete removed rows
  const deleted = [...knownIds].filter((id) => !currentIds.has(id))
  if (deleted.length > 0) {
    const { error } = await supabase.from(table).delete().in(pk, deleted)
    if (error) return { knownIds, error: `delete: ${error.message}` }
  }

  // 2. Upsert current rows (handles both insert and update)
  if (rows.length > 0) {
    const { error } = await supabase
      .from(table)
      .upsert(rows as any[], { onConflict: pk })
    if (error) return { knownIds, error: `upsert: ${error.message}` }
  }

  return { knownIds: currentIds, error: null }
}

/**
 * Upsert a single row for 1:1 tables (e.g. `design_systems` keyed on `project_id`).
 *
 * @param table - Supabase table name
 * @param row   - The full row (DB-shaped)
 * @param options - pk (the conflict column, e.g. 'project_id')
 */
export async function upsertRow<T extends Record<string, unknown>>(
  table: string,
  row: T,
  options: SyncOptions<T> = {},
): Promise<{ error: string | null }> {
  const pk = (options.pk ?? 'id') as string
  const { error } = await supabase
    .from(table)
    .upsert(row as any, { onConflict: pk })
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Delete a single row by PK.
 */
export async function deleteRow(
  table: string,
  id: string,
  pk = 'id',
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(table).delete().eq(pk, id)
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Insert a single row and return it.
 */
export async function insertRow<T extends Record<string, unknown>>(
  table: string,
  row: T,
): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase
    .from(table)
    .insert(row as any)
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
