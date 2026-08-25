import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/stores/themeStore";

interface ItemCardProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  leftIconColor?: string;
  leftIconBg?: string;
  rightText?: string;
  rightColor?: string;
  checked?: boolean;
  onCheck?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
  checkColor?: string;
}

export function ItemCard({
  title,
  subtitle,
  leftIcon,
  leftIconColor,
  leftIconBg,
  rightText,
  rightColor,
  checked,
  onCheck,
  onDelete,
  onPress,
  checkColor = "#FF6B9D",
}: ItemCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Checkbox */}
      {onCheck !== undefined && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onCheck();
          }}
          activeOpacity={0.7}
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: checked ? checkColor : theme.borderStrong,
            backgroundColor: checked ? checkColor : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {checked && <Ionicons name="checkmark" size={14} color="white" />}
        </TouchableOpacity>
      )}

      {/* Left icon */}
      {leftIcon && (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: leftIconBg ?? theme.brandLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={leftIcon as any} size={20} color={leftIconColor ?? theme.brand} />
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: checked ? theme.textSecondary : theme.text,
            textDecorationLine: checked ? "line-through" : "none",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>

      {/* Right */}
      {rightText && (
        <Text style={{ fontSize: 13, fontWeight: "600", color: rightColor ?? theme.brand }}>
          {rightText}
        </Text>
      )}

      {/* Delete */}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
