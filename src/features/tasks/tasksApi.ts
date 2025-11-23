import { supabase } from 'src/lib/supabase';
import { getOrCreateProfile } from 'src/features/profile/profileApi';
import { TABLES } from 'src/lib/dbTables';

export type TaskList = {
  id: string;
  couple_id: string;
  name: string;
};

export type Task = {
  id: string;
  couple_id: string;
  list_id: string | null;
  title: string;
  done: boolean;
  assigned_to: string | null;
  effort: number | null;
  priority: number | null;
  category: string | null;
  due_date: string | null;
  is_routine: boolean | null;
  routine_every_days: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureDefaultList(): Promise<TaskList> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const couple_id = profile.couple_id as string;
  const { data: existing } = await supabase
    .from(TABLES.taskLists)
    .select('id, couple_id, name')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: true })
    .limit(1);
  if (existing && existing.length > 0) return existing[0] as TaskList;
  const { data, error } = await supabase
    .from(TABLES.taskLists)
    .insert({ couple_id, name: 'Général' })
    .select('id, couple_id, name')
    .single();
  if (error) throw error;
  return data as TaskList;
}

export async function fetchTasks(listId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from(TABLES.tasks)
    .select('id, couple_id, list_id, title, done, assigned_to, effort, priority, category, due_date, is_routine, routine_every_days, completed_at, created_at, updated_at')
    .eq('list_id', listId)
    .order('done', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Task[];
}

export async function addTask(listId: string, title: string): Promise<Task> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const { data, error } = await supabase
    .from(TABLES.tasks)
    .insert({ couple_id: profile.couple_id, list_id: listId, title })
    .select('id, couple_id, list_id, title, done, assigned_to, effort, priority, category, due_date, is_routine, routine_every_days, completed_at, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as Task;
}

export async function addTaskDetailed(listId: string, params: {
  title: string;
  category?: string | null;
  assigned_to?: string | null;
  frequency_days?: number | null; // 1 quotidien, 7 hebdomadaire, etc.
  due_date?: string | null;
}): Promise<Task> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const insert: any = {
    couple_id: profile.couple_id,
    list_id: listId,
    title: params.title,
  };
  if (params.category) insert.category = params.category;
  if (params.assigned_to) insert.assigned_to = params.assigned_to;
  if (params.frequency_days) {
    insert.is_routine = true;
    insert.routine_every_days = params.frequency_days;
  }
  const { data, error } = await supabase
    .from(TABLES.tasks)
    .insert(insert)
    .select('id, couple_id, list_id, title, done, assigned_to, effort, priority, category, due_date, is_routine, routine_every_days, completed_at, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as Task;
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from(TABLES.tasks)
    .update({ done, completed_at: done ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function removeTask(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.tasks).delete().eq('id', id);
  if (error) throw error;
}

export async function updateTaskTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.tasks)
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function removeDoneTasks(listId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.tasks)
    .delete()
    .eq('list_id', listId)
    .eq('done', true);
  if (error) throw error;
}

export async function distributeTasks(listId?: string): Promise<number> {
  const { data, error } = await supabase.rpc('distribute_tasks_intelligently', { p_couple_id: null, p_list_id: listId ?? null });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function claimTask(taskId: string): Promise<void> {
  const { error } = await supabase.rpc('claim_task', { p_task_id: taskId });
  if (error) throw error;
}

export type ProfileLite = { id: string; display_name: string | null; avatar_url: string | null; email?: string | null };

export async function fetchAssignees(userIds: string[]): Promise<Record<string, ProfileLite>> {
  const ids = [...new Set(userIds.filter(Boolean))] as string[];
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select('id, display_name, avatar_url, email')
    .in('id', ids);
  if (error) throw error;
  const map: Record<string, ProfileLite> = {};
  (data || []).forEach((p: any) => { map[p.id] = p as ProfileLite; });
  return map;
}

export async function updateTaskPriority(id: string, priority: number): Promise<void> {
  const { error } = await supabase.from(TABLES.tasks).update({ priority, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function updateTaskRoutine(id: string, is_routine: boolean, everyDays?: number | null): Promise<void> {
  const patch: any = { is_routine, updated_at: new Date().toISOString() };
  if (everyDays !== undefined) patch.routine_every_days = everyDays;
  const { error } = await supabase.from(TABLES.tasks).update(patch).eq('id', id);
  if (error) throw error;
}

export async function updateTaskCategory(id: string, category: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLES.tasks)
    .update({ category, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function updateTaskAssignee(id: string, assigned_to: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLES.tasks)
    .update({ assigned_to, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function updateTaskDueDate(id: string, due_date: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLES.tasks)
    .update({ due_date, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
