import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const QUICK = [
  {
    label: "Tâche",
    icon: "checkmark-circle",
    color: "#FF6B9D",
    route: "/modals/add-task",
    xp: "+10 XP",
  },
  { label: "Courses", icon: "cart", color: "#1D9E75", route: "/modals/add-item", xp: "+3 XP" },
  { label: "Émotion", icon: "heart", color: "#A78BFA", route: "/modals/add-emotion", xp: "+10 XP" },
  { label: "Photo", icon: "camera", color: "#EC4899", route: "/modals/add-photo", xp: "+10 XP" },
];

export function QuickActions() {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-500 mb-3">Action rapide</Text>
      <View className="flex-row gap-2">
        {QUICK.map((q) => (
          <TouchableOpacity
            key={q.label}
            onPress={() => router.push(q.route as any)}
            activeOpacity={0.7}
            className="flex-1"
          >
            <View className="bg-white rounded-2xl p-3 border border-gray-100 items-center gap-1">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${q.color}18` }}
              >
                <Ionicons name={q.icon as any} size={18} color={q.color} />
              </View>
              <Text className="text-xs font-medium text-gray-700">{q.label}</Text>
              <Text className="text-xs" style={{ color: q.color }}>
                {q.xp}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
