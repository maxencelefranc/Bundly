import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

interface XPBarProps {
  current: number;
  toNext: number;
  progress: number;
}

export function XPBar({ current, toNext, progress }: XPBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(progress, 1), { duration: 800 });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View>
      <View className="bg-white/25 rounded-full h-2 overflow-hidden">
        <Animated.View className="h-full bg-white rounded-full" style={animStyle} />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-white/70 text-xs">{current} XP</Text>
        <Text className="text-white/70 text-xs">+{toNext} XP pour le prochain niveau</Text>
      </View>
    </View>
  );
}
