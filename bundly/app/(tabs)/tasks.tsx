import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { ItemCard } from "@/components/shared/ItemCard";
import { useTheme } from "@/stores/themeStore";
import { useTasks, useToggleTask, useDeleteTask } from "@/features/tasks/hooks";
import type { Task } from "@/features/tasks/api";

const PRIORITY_CONFIG = {
  low: { color: "#94A3B8", label: "Basse" },
  medium: { color: "#F59E0B", label: "Moyenne" },
  high: { color: "#EF4444", label: "Haute" },
};

function TaskRow({ task }: { task: Task }) {
  const toggle = useToggleTask();
  const remove = useDeleteTask();

  return (
    <ItemCard
      title={task.title}
      subtitle={task.priority !== "medium" ? PRIORITY_CONFIG[task.priority].label : undefined}
      checked={task.completed}
      onCheck={() => toggle.mutate({ id: task.id, completed: !task.completed })}
      onDelete={() => remove.mutate(task.id)}
      checkColor="#FF6B9D"
      rightText={task.completed ? undefined : undefined}
    />
  );
}

export default function TasksScreen() {
  const theme = useTheme();
  const { data: tasks, isLoading } = useTasks();

  const pending = tasks?.filter((t) => !t.completed) ?? [];
  const completed = tasks?.filter((t) => t.completed) ?? [];

  return (
    <ScreenLayout
      title="Tâches"
      subtitle={`${pending.length} en cours · ${completed.length} terminées`}
      color="#FF6B9D"
      icon="checkmark-circle-outline"
      onAdd={() => router.push("/(modals)/add-task")}
    >
      {isLoading ? (
        <ActivityIndicator color="#FF6B9D" style={{ marginTop: 40 }} />
      ) : tasks?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: theme.brandLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 32 }}>✅</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucune tâche
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center" }}>
            Ajoutez votre première tâche pour commencer
          </Text>
        </View>
      ) : (
        <>
          {pending.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.textMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                En cours
              </Text>
              {pending.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </View>
          )}
          {completed.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.textMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Terminées
              </Text>
              {completed.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </View>
          )}
        </>
      )}
    </ScreenLayout>
  );
}
