import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: "modal" }}>
      <Stack.Screen name="add-task" />
      <Stack.Screen name="add-emotion" />
      <Stack.Screen name="add-appointment" />
      <Stack.Screen name="add-food" />
      <Stack.Screen name="add-date" />
      <Stack.Screen name="add-fitness" />
      <Stack.Screen name="add-treatment" />
      <Stack.Screen name="add-pet" />
      <Stack.Screen name="add-subscription" />
      <Stack.Screen name="add-vehicle" />
      <Stack.Screen name="add-meal" />
      <Stack.Screen name="nutrition-goals" />
    </Stack>
  );
}
