import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/stores/themeStore";
import { useTodayMeals, useNutritionGoal, useDeleteMeal } from "@/features/nutrition/hooks";
import { computeTotals, MEAL_TYPES, type NutritionMeal } from "@/features/nutrition/api";
import { useAppStore } from "@/stores/appStore";

function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const theme = useTheme();
  const progress = Math.min(value / goal, 1);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 10, color: theme.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 10, fontWeight: "600", color }}>{value}g</Text>
      </View>
      <View
        style={{
          height: 4,
          borderRadius: 4,
          backgroundColor: theme.bgSecondary,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            borderRadius: 4,
            backgroundColor: color,
            width: `${progress * 100}%`,
          }}
        />
      </View>
    </View>
  );
}

function CalorieRing({ current, goal }: { current: number; goal: number }) {
  const theme = useTheme();
  const progress = Math.min(current / goal, 1);
  const remaining = Math.max(goal - current, 0);
  const color = progress > 1 ? "#EF4444" : progress > 0.8 ? "#F59E0B" : "#8B5CF6";

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 8,
          borderColor: theme.bgSecondary,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 8,
            borderColor: color,
            borderTopColor: "transparent",
            borderRightColor: progress > 0.25 ? color : "transparent",
            borderBottomColor: progress > 0.5 ? color : "transparent",
            borderLeftColor: progress > 0.75 ? color : "transparent",
            transform: [{ rotate: "-90deg" }],
          }}
        />
        <Text style={{ fontSize: 20, fontWeight: "700", color }}>{current}</Text>
        <Text style={{ fontSize: 9, color: theme.textSecondary }}>kcal</Text>
      </View>
      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 6 }}>
        {remaining > 0 ? `${remaining} restantes` : "Objectif atteint !"}
      </Text>
    </View>
  );
}

function MealCard({ meal, isOwn }: { meal: NutritionMeal; isOwn: boolean }) {
  const theme = useTheme();
  const deleteMeal = useDeleteMeal();
  const mealConfig = MEAL_TYPES.find((m) => m.key === meal.meal_type);
  const mealTotal = meal.items?.reduce((acc, i) => acc + i.calories * i.quantity, 0) ?? 0;

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: meal.items?.length ? 10 : 0,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: `${mealConfig?.color}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>{mealConfig?.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>
            {mealConfig?.label}
            {meal.shared ? " 💑" : ""}
          </Text>
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>
            {meal.items?.length ?? 0} aliment(s)
          </Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: mealConfig?.color }}>
          {Math.round(mealTotal)} kcal
        </Text>
        {isOwn && (
          <TouchableOpacity onPress={() => deleteMeal.mutate(meal.id)} activeOpacity={0.6}>
            <Text style={{ color: theme.textMuted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {meal.items?.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 4,
            borderTopWidth: i === 0 ? 0.5 : 0,
            borderTopColor: theme.border,
          }}
        >
          <View
            style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: mealConfig?.color }}
          />
          <Text style={{ flex: 1, fontSize: 12, color: theme.text }}>{item.food_name}</Text>
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>
            {item.quantity} {item.unit}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "500", color: theme.textSecondary }}>
            {Math.round(item.calories * item.quantity)} kcal
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { profile } = useAppStore();
  const { data: meals, isLoading } = useTodayMeals();
  const { data: goal } = useNutritionGoal();
  const [showPartner, setShowPartner] = useState(false);

  const myMeals = meals?.filter((m) => m.profile_id === profile?.id) ?? [];
  const partnerMeals = meals?.filter((m) => m.profile_id !== profile?.id && m.shared) ?? [];
  const totals = computeTotals(myMeals);
  const calorieGoal = goal?.calories ?? 2000;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "600", color: theme.text }}>Nutrition</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(modals)/add-meal")}
          activeOpacity={0.8}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#8B5CF6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 22, fontWeight: "300" }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, gap: 14 }}>
          {/* Résumé calorique */}
          <View
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <CalorieRing current={totals.calories} goal={calorieGoal} />
              <View style={{ flex: 1, gap: 10 }}>
                <MacroBar
                  label="Protéines"
                  value={totals.proteins}
                  goal={goal?.proteins ?? 50}
                  color="#FF6B9D"
                />
                <MacroBar
                  label="Glucides"
                  value={totals.carbs}
                  goal={goal?.carbs ?? 250}
                  color="#F59E0B"
                />
                <MacroBar
                  label="Lipides"
                  value={totals.fats}
                  goal={goal?.fats ?? 70}
                  color="#8B5CF6"
                />
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 0.5,
                borderTopColor: theme.border,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                  {totals.calories}
                </Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>kcal consommées</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                  {calorieGoal}
                </Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>kcal objectif</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color:
                      Math.max(calorieGoal - totals.calories, 0) === 0 ? "#22C55E" : theme.text,
                  }}
                >
                  {Math.max(calorieGoal - totals.calories, 0)}
                </Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>kcal restantes</Text>
              </View>
            </View>
          </View>

          {/* Mes repas */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 10 }}>
              Mes repas
            </Text>
            {isLoading ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : myMeals.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 32,
                  backgroundColor: theme.bgCard,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🍽️</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                  Aucun repas enregistré
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(modals)/add-meal")}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 12,
                    backgroundColor: "#8B5CF6",
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                    Ajouter mon premier repas
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              myMeals.map((meal) => <MealCard key={meal.id} meal={meal} isOwn={true} />)
            )}
          </View>

          {/* Repas partenaire */}
          {partnerMeals.length > 0 && (
            <View>
              <TouchableOpacity
                onPress={() => setShowPartner(!showPartner)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                  Repas partagés 💑
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {showPartner ? "Masquer" : "Voir"}
                </Text>
              </TouchableOpacity>
              {showPartner &&
                partnerMeals.map((meal) => <MealCard key={meal.id} meal={meal} isOwn={false} />)}
            </View>
          )}

          {/* Objectifs */}
          <TouchableOpacity
            onPress={() => router.push("/(modals)/nutrition-goals" as any)}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: theme.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: "#F5F3FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>🎯</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>
                Mes objectifs
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                {calorieGoal} kcal / jour
              </Text>
            </View>
            <Text style={{ color: theme.textMuted }}>›</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}
