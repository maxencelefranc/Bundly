import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, addTask, toggleTask, deleteTask, type Task } from "./api";
import { useAppStore } from "@/stores/appStore";

export function useTasks() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["tasks", couple?.id],
    queryFn: () => fetchTasks(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  const { couple, profile } = useAppStore();

  return useMutation({
    mutationFn: (task: Pick<Task, "title"> & Partial<Task>) =>
      addTask(couple!.id, profile!.id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", couple?.id] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const task = await toggleTask(id, completed);
      if (completed) {
        await awardXP("task_complete", "tasks");
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", couple?.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", couple?.id] });
    },
  });
}
