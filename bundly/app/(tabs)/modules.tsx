import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MODULES } from "@/types";

export default function ModulesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top + 16 }} className="px-4">
        <Text className="text-2xl font-semibold text-gray-900 mb-1">Modules</Text>
        <Text className="text-sm text-gray-400 mb-6">Chaque action rapporte des XP</Text>

        <View className="flex-row flex-wrap gap-3">
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.key}
              onPress={() => router.push(mod.route as any)}
              activeOpacity={0.7}
              style={{ width: "47%" }}
            >
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                {/* Icon */}
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: `${mod.color}18` }}
                >
                  <Ionicons name={mod.icon as any} size={20} color={mod.color} />
                </View>

                <Text className="text-sm font-medium text-gray-900 mb-1">{mod.label}</Text>

                {/* XP badge */}
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs" style={{ color: mod.color }}>
                    +{mod.xpPerAction} XP / action
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
