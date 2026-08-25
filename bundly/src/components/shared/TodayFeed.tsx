import { View, Text } from "react-native";

export function TodayFeed() {
  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          color: "#94A3B8",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginBottom: 10,
          fontWeight: "500",
        }}
      >
        Aujourd&apos;hui
      </Text>
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#F1F5F9",
        }}
      >
        <Text style={{ color: "#94A3B8", fontSize: 14, textAlign: "center" }}>
          Aucune activité pour l&apos;instant
        </Text>
      </View>
    </View>
  );
}
