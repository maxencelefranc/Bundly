import { supabase } from "@/lib/supabase";

export interface Task {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  routine: boolean;
  routine_frequency: string | null;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export async function fetchTasks(coupleId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("couple_id", coupleId)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addTask(
  coupleId: string,
  createdBy: string,
  task: Pick<Task, "title"> & Partial<Task>
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ couple_id: coupleId, created_by: createdBy, ...task })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleTask(taskId: string, completed: boolean): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}
