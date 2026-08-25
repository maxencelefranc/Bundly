import { View, Text } from "react-native";
import { format, startOfWeek, addDays, isToday, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

export function WeekStreak() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <Text className="text-sm font-medium text-gray-500 mb-3">Activité cette semaine</Text>
      <View className="flex-row gap-1">
        {days.map((day, i) => {
          const isPast = isBefore(day, today) && !isToday(day);
          const isTodayDay = isToday(day);
          const isFuture = !isPast && !isTodayDay;

          return (
            <View key={i} className="flex-1 items-center gap-1">
              <Text className="text-xs text-gray-400">{format(day, "EEEEE", { locale: fr })}</Text>
              <View
                className={`w-full h-8 rounded-lg items-center justify-center ${
                  isTodayDay ? "bg-brand" : isPast ? "bg-pink-100" : "bg-gray-100"
                }`}
                style={isTodayDay ? { backgroundColor: "#FF6B9D" } : undefined}
              >
                {(isPast || isTodayDay) && (
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isTodayDay ? "white" : "#FF6B9D" }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
