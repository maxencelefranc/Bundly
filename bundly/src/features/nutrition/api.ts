import { supabase } from "@/lib/supabase";

export interface NutritionFood {
  id: string;
  name: string;
  calories: number;
  proteins: number | null;
  carbs: number | null;
  fats: number | null;
  unit: string;
  is_custom: boolean;
  created_by: string | null;
}

export interface NutritionMeal {
  id: string;
  profile_id: string;
  couple_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string | null;
  shared: boolean;
  logged_at: string;
  items?: NutritionMealItem[];
}

export interface NutritionMealItem {
  id: string;
  meal_id: string;
  food_name: string;
  calories: number;
  proteins: number | null;
  carbs: number | null;
  fats: number | null;
  quantity: number;
  unit: string;
}

export interface NutritionGoal {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface AIFoodItem {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  quantity: number;
  unit: string;
}

export const MEAL_TYPES = [
  { key: "breakfast", label: "Petit-déjeuner", emoji: "🌅", color: "#F59E0B" },
  { key: "lunch", label: "Déjeuner", emoji: "☀️", color: "#22C55E" },
  { key: "dinner", label: "Dîner", emoji: "🌙", color: "#8B5CF6" },
  { key: "snack", label: "Collation", emoji: "🍎", color: "#EC4899" },
] as const;

export type MealTypeKey = (typeof MEAL_TYPES)[number]["key"];

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchTodayMeals(
  profileId: string,
  coupleId: string
): Promise<NutritionMeal[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data: meals, error } = await supabase
    .from("nutrition_meals")
    .select("*")
    .or(`profile_id.eq.${profileId},couple_id.eq.${coupleId}`)
    .eq("logged_at", today)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!meals || meals.length === 0) return [];

  const { data: items } = await supabase
    .from("nutrition_meal_items")
    .select("*")
    .in(
      "meal_id",
      meals.map((m) => m.id)
    );

  return meals.map((meal) => ({
    ...meal,
    items: items?.filter((item) => item.meal_id === meal.id) ?? [],
  }));
}

export async function fetchGoal(profileId: string): Promise<NutritionGoal> {
  const { data } = await supabase
    .from("nutrition_goals")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return data ?? { calories: 2000, proteins: 50, carbs: 250, fats: 70 };
}

export async function upsertGoal(profileId: string, goal: NutritionGoal): Promise<void> {
  const { error } = await supabase
    .from("nutrition_goals")
    .upsert({ profile_id: profileId, ...goal, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function searchFoods(query: string): Promise<NutritionFood[]> {
  const { data, error } = await supabase
    .from("nutrition_foods")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function addMealWithItems(
  profileId: string,
  coupleId: string,
  mealType: MealTypeKey,
  items: AIFoodItem[],
  shared: boolean = false,
  name?: string
): Promise<NutritionMeal> {
  const { data: meal, error: mealError } = await supabase
    .from("nutrition_meals")
    .insert({
      profile_id: profileId,
      couple_id: coupleId,
      meal_type: mealType,
      shared,
      name: name ?? null,
      logged_at: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (mealError) throw mealError;

  const mealItems = items.map((item) => ({
    meal_id: meal.id,
    food_name: item.name,
    calories: item.calories,
    proteins: item.proteins,
    carbs: item.carbs,
    fats: item.fats,
    quantity: item.quantity,
    unit: item.unit,
  }));

  const { error: itemsError } = await supabase.from("nutrition_meal_items").insert(mealItems);

  if (itemsError) throw itemsError;
  return meal;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from("nutrition_meals").delete().eq("id", id);
  if (error) throw error;
}

export function computeTotals(meals: NutritionMeal[]): {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
} {
  let calories = 0,
    proteins = 0,
    carbs = 0,
    fats = 0;
  meals.forEach((meal) => {
    meal.items?.forEach((item) => {
      calories += item.calories * item.quantity;
      proteins += (item.proteins ?? 0) * item.quantity;
      carbs += (item.carbs ?? 0) * item.quantity;
      fats += (item.fats ?? 0) * item.quantity;
    });
  });
  return {
    calories: Math.round(calories),
    proteins: Math.round(proteins),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
}

const LOCAL_FOODS: AIFoodItem[] = [
  // ── Féculents ────────────────────────────────────────────────────────────────
  {
    name: "Pâtes cuites",
    calories: 158,
    proteins: 5.8,
    carbs: 31,
    fats: 0.9,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pâtes crues",
    calories: 356,
    proteins: 12,
    carbs: 72,
    fats: 1.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pâtes complètes cuites",
    calories: 140,
    proteins: 5.5,
    carbs: 27,
    fats: 0.8,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Riz blanc cuit",
    calories: 130,
    proteins: 2.7,
    carbs: 28,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Riz complet cuit",
    calories: 123,
    proteins: 2.7,
    carbs: 26,
    fats: 0.9,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Riz basmati cuit",
    calories: 121,
    proteins: 2.5,
    carbs: 25,
    fats: 0.4,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Quinoa cuit",
    calories: 120,
    proteins: 4.4,
    carbs: 22,
    fats: 1.9,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Semoule cuite",
    calories: 112,
    proteins: 3.8,
    carbs: 23,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pomme de terre cuite",
    calories: 86,
    proteins: 2,
    carbs: 20,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pomme de terre vapeur",
    calories: 80,
    proteins: 2,
    carbs: 18,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  { name: "Frites", calories: 274, proteins: 3.4, carbs: 36, fats: 13, quantity: 1, unit: "100g" },
  {
    name: "Purée de pommes de terre",
    calories: 105,
    proteins: 2.5,
    carbs: 17,
    fats: 4,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pain blanc",
    calories: 265,
    proteins: 8,
    carbs: 55,
    fats: 1.2,
    quantity: 1,
    unit: "100g",
  },
  { name: "Baguette", calories: 270, proteins: 9, carbs: 55, fats: 1.2, quantity: 1, unit: "100g" },
  {
    name: "Pain complet",
    calories: 247,
    proteins: 9,
    carbs: 45,
    fats: 2.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pain de mie blanc",
    calories: 265,
    proteins: 8,
    carbs: 50,
    fats: 3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pain de mie complet",
    calories: 235,
    proteins: 9,
    carbs: 44,
    fats: 3,
    quantity: 1,
    unit: "100g",
  },
  { name: "Croissant", calories: 406, proteins: 8, carbs: 46, fats: 21, quantity: 1, unit: "100g" },
  {
    name: "Pain au chocolat",
    calories: 390,
    proteins: 7,
    carbs: 47,
    fats: 19,
    quantity: 1,
    unit: "100g",
  },
  { name: "Brioche", calories: 380, proteins: 8, carbs: 47, fats: 18, quantity: 1, unit: "100g" },
  {
    name: "Lentilles cuites",
    calories: 116,
    proteins: 9,
    carbs: 20,
    fats: 0.4,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pois chiches cuits",
    calories: 164,
    proteins: 9,
    carbs: 27,
    fats: 2.6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Haricots rouges cuits",
    calories: 127,
    proteins: 8.7,
    carbs: 22,
    fats: 0.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Haricots blancs cuits",
    calories: 139,
    proteins: 9.7,
    carbs: 25,
    fats: 0.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Flocons d'avoine",
    calories: 389,
    proteins: 17,
    carbs: 66,
    fats: 7,
    quantity: 1,
    unit: "100g",
  },
  { name: "Müesli", calories: 370, proteins: 10, carbs: 62, fats: 7, quantity: 1, unit: "100g" },
  {
    name: "Corn flakes",
    calories: 357,
    proteins: 7,
    carbs: 84,
    fats: 0.9,
    quantity: 1,
    unit: "100g",
  },
  { name: "Granola", calories: 450, proteins: 10, carbs: 65, fats: 17, quantity: 1, unit: "100g" },

  // ── Viandes ──────────────────────────────────────────────────────────────────
  {
    name: "Poulet grillé",
    calories: 165,
    proteins: 31,
    carbs: 0,
    fats: 3.6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Poulet rôti",
    calories: 190,
    proteins: 29,
    carbs: 0,
    fats: 8,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Blanc de poulet",
    calories: 110,
    proteins: 23,
    carbs: 0,
    fats: 1.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Cuisse de poulet",
    calories: 215,
    proteins: 22,
    carbs: 0,
    fats: 14,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Dinde grillée",
    calories: 135,
    proteins: 30,
    carbs: 0,
    fats: 1.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Steak haché 5%",
    calories: 121,
    proteins: 20,
    carbs: 0,
    fats: 5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Steak haché 10%",
    calories: 158,
    proteins: 19,
    carbs: 0,
    fats: 10,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Steak haché 15%",
    calories: 195,
    proteins: 17,
    carbs: 0,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  { name: "Entrecôte", calories: 220, proteins: 26, carbs: 0, fats: 13, quantity: 1, unit: "100g" },
  {
    name: "Filet de boeuf",
    calories: 158,
    proteins: 28,
    carbs: 0,
    fats: 5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Côtelette de porc",
    calories: 215,
    proteins: 22,
    carbs: 0,
    fats: 14,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Filet de porc",
    calories: 143,
    proteins: 22,
    carbs: 0,
    fats: 6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Jambon blanc",
    calories: 107,
    proteins: 18,
    carbs: 1,
    fats: 3.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Jambon cru",
    calories: 145,
    proteins: 22,
    carbs: 0.5,
    fats: 6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Lardons fumés",
    calories: 340,
    proteins: 15,
    carbs: 0.5,
    fats: 31,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Saucisse de Francfort",
    calories: 274,
    proteins: 12,
    carbs: 2,
    fats: 25,
    quantity: 1,
    unit: "100g",
  },
  { name: "Merguez", calories: 285, proteins: 14, carbs: 2, fats: 25, quantity: 1, unit: "100g" },
  { name: "Chipolata", calories: 290, proteins: 13, carbs: 2, fats: 26, quantity: 1, unit: "100g" },
  {
    name: "Agneau côtelette",
    calories: 235,
    proteins: 24,
    carbs: 0,
    fats: 16,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Veau escalope",
    calories: 130,
    proteins: 24,
    carbs: 0,
    fats: 4,
    quantity: 1,
    unit: "100g",
  },

  // ── Poissons & fruits de mer ──────────────────────────────────────────────────
  {
    name: "Saumon frais",
    calories: 208,
    proteins: 20,
    carbs: 0,
    fats: 13,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Saumon fumé",
    calories: 175,
    proteins: 20,
    carbs: 0,
    fats: 10,
    quantity: 1,
    unit: "100g",
  },
  { name: "Thon frais", calories: 144, proteins: 23, carbs: 0, fats: 5, quantity: 1, unit: "100g" },
  {
    name: "Thon en boîte",
    calories: 116,
    proteins: 26,
    carbs: 0,
    fats: 1,
    quantity: 1,
    unit: "100g",
  },
  { name: "Cabillaud", calories: 82, proteins: 18, carbs: 0, fats: 0.7, quantity: 1, unit: "100g" },
  { name: "Tilapia", calories: 96, proteins: 20, carbs: 0, fats: 2, quantity: 1, unit: "100g" },
  {
    name: "Crevettes cuites",
    calories: 99,
    proteins: 21,
    carbs: 0.9,
    fats: 1.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Moules cuites",
    calories: 86,
    proteins: 12,
    carbs: 3.7,
    fats: 2.2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Sardines en boîte",
    calories: 208,
    proteins: 25,
    carbs: 0,
    fats: 11,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Maquereau grillé",
    calories: 262,
    proteins: 24,
    carbs: 0,
    fats: 18,
    quantity: 1,
    unit: "100g",
  },

  // ── Oeufs & produits laitiers ────────────────────────────────────────────────
  {
    name: "Oeuf (1 unité)",
    calories: 78,
    proteins: 6.5,
    carbs: 0.5,
    fats: 5.5,
    quantity: 1,
    unit: "unité",
  },
  {
    name: "Oeufs brouillés",
    calories: 170,
    proteins: 12,
    carbs: 1.5,
    fats: 13,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Omelette nature",
    calories: 155,
    proteins: 11,
    carbs: 1,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Lait entier",
    calories: 61,
    proteins: 3.2,
    carbs: 4.8,
    fats: 3.3,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Lait demi-écrémé",
    calories: 46,
    proteins: 3.2,
    carbs: 4.8,
    fats: 1.6,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Lait écrémé",
    calories: 34,
    proteins: 3.4,
    carbs: 5,
    fats: 0.2,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Lait végétal soja",
    calories: 33,
    proteins: 3,
    carbs: 1.7,
    fats: 1.8,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Lait d'amande",
    calories: 24,
    proteins: 0.6,
    carbs: 3.2,
    fats: 1.2,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Yaourt nature",
    calories: 59,
    proteins: 3.5,
    carbs: 4.7,
    fats: 3.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Yaourt 0%",
    calories: 43,
    proteins: 4.3,
    carbs: 5.5,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Yaourt aux fruits",
    calories: 95,
    proteins: 3.2,
    carbs: 17,
    fats: 1.5,
    quantity: 1,
    unit: "100g",
  },
  { name: "Skyr", calories: 57, proteins: 10, carbs: 4, fats: 0.3, quantity: 1, unit: "100g" },
  {
    name: "Fromage blanc 0%",
    calories: 48,
    proteins: 8,
    carbs: 4,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Fromage blanc 20%",
    calories: 90,
    proteins: 7,
    carbs: 4,
    fats: 5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Crème fraîche épaisse",
    calories: 292,
    proteins: 2.4,
    carbs: 2.9,
    fats: 30,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Crème légère",
    calories: 165,
    proteins: 2.9,
    carbs: 3.5,
    fats: 16,
    quantity: 1,
    unit: "100g",
  },
  { name: "Beurre", calories: 717, proteins: 0.9, carbs: 0.1, fats: 81, quantity: 1, unit: "100g" },
  {
    name: "Margarine",
    calories: 537,
    proteins: 0.1,
    carbs: 0.5,
    fats: 60,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Camembert",
    calories: 300,
    proteins: 20,
    carbs: 0.5,
    fats: 24,
    quantity: 1,
    unit: "100g",
  },
  { name: "Emmental", calories: 380, proteins: 28, carbs: 0, fats: 30, quantity: 1, unit: "100g" },
  { name: "Comté", calories: 415, proteins: 27, carbs: 0, fats: 34, quantity: 1, unit: "100g" },
  { name: "Gruyère", calories: 396, proteins: 27, carbs: 0, fats: 32, quantity: 1, unit: "100g" },
  {
    name: "Mozzarella",
    calories: 280,
    proteins: 18,
    carbs: 2.2,
    fats: 22,
    quantity: 1,
    unit: "100g",
  },
  { name: "Feta", calories: 264, proteins: 14, carbs: 4, fats: 21, quantity: 1, unit: "100g" },
  {
    name: "Parmesan",
    calories: 431,
    proteins: 38,
    carbs: 3.2,
    fats: 29,
    quantity: 1,
    unit: "100g",
  },
  { name: "Roquefort", calories: 369, proteins: 21, carbs: 2, fats: 31, quantity: 1, unit: "100g" },
  {
    name: "Chèvre frais",
    calories: 230,
    proteins: 15,
    carbs: 2,
    fats: 18,
    quantity: 1,
    unit: "100g",
  },

  // ── Fruits ────────────────────────────────────────────────────────────────────
  { name: "Pomme", calories: 52, proteins: 0.3, carbs: 14, fats: 0.2, quantity: 1, unit: "100g" },
  { name: "Poire", calories: 57, proteins: 0.4, carbs: 15, fats: 0.1, quantity: 1, unit: "100g" },
  { name: "Banane", calories: 89, proteins: 1.1, carbs: 23, fats: 0.3, quantity: 1, unit: "100g" },
  { name: "Orange", calories: 47, proteins: 0.9, carbs: 12, fats: 0.1, quantity: 1, unit: "100g" },
  {
    name: "Mandarine",
    calories: 53,
    proteins: 0.8,
    carbs: 13,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  { name: "Citron", calories: 29, proteins: 1.1, carbs: 9, fats: 0.3, quantity: 1, unit: "100g" },
  { name: "Raisin", calories: 67, proteins: 0.6, carbs: 17, fats: 0.4, quantity: 1, unit: "100g" },
  {
    name: "Fraises",
    calories: 32,
    proteins: 0.7,
    carbs: 7.7,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Framboises",
    calories: 52,
    proteins: 1.2,
    carbs: 12,
    fats: 0.7,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Myrtilles",
    calories: 57,
    proteins: 0.7,
    carbs: 14,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  { name: "Cerise", calories: 63, proteins: 1.1, carbs: 16, fats: 0.2, quantity: 1, unit: "100g" },
  { name: "Pêche", calories: 39, proteins: 0.9, carbs: 10, fats: 0.3, quantity: 1, unit: "100g" },
  { name: "Abricot", calories: 48, proteins: 1.4, carbs: 11, fats: 0.4, quantity: 1, unit: "100g" },
  { name: "Kiwi", calories: 61, proteins: 1.1, carbs: 15, fats: 0.5, quantity: 1, unit: "100g" },
  { name: "Mangue", calories: 60, proteins: 0.8, carbs: 15, fats: 0.4, quantity: 1, unit: "100g" },
  { name: "Ananas", calories: 50, proteins: 0.5, carbs: 13, fats: 0.1, quantity: 1, unit: "100g" },
  {
    name: "Pastèque",
    calories: 30,
    proteins: 0.6,
    carbs: 7.6,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  { name: "Melon", calories: 34, proteins: 0.8, carbs: 8, fats: 0.2, quantity: 1, unit: "100g" },
  { name: "Avocat", calories: 160, proteins: 2, carbs: 9, fats: 15, quantity: 1, unit: "100g" },
  { name: "Noix", calories: 654, proteins: 15, carbs: 14, fats: 65, quantity: 1, unit: "100g" },
  { name: "Amandes", calories: 579, proteins: 21, carbs: 22, fats: 50, quantity: 1, unit: "100g" },
  {
    name: "Noisettes",
    calories: 628,
    proteins: 15,
    carbs: 17,
    fats: 61,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Cacahuètes",
    calories: 567,
    proteins: 26,
    carbs: 16,
    fats: 49,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Noix de cajou",
    calories: 553,
    proteins: 18,
    carbs: 30,
    fats: 44,
    quantity: 1,
    unit: "100g",
  },

  // ── Légumes ───────────────────────────────────────────────────────────────────
  { name: "Tomate", calories: 18, proteins: 0.9, carbs: 3.9, fats: 0.2, quantity: 1, unit: "100g" },
  {
    name: "Concombre",
    calories: 15,
    proteins: 0.7,
    carbs: 3.6,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Salade verte",
    calories: 15,
    proteins: 1.4,
    carbs: 2.9,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Épinards",
    calories: 23,
    proteins: 2.9,
    carbs: 3.6,
    fats: 0.4,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Carottes",
    calories: 41,
    proteins: 0.9,
    carbs: 10,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  { name: "Brocoli", calories: 34, proteins: 2.8, carbs: 7, fats: 0.4, quantity: 1, unit: "100g" },
  {
    name: "Chou-fleur",
    calories: 25,
    proteins: 1.9,
    carbs: 5,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Haricots verts",
    calories: 31,
    proteins: 1.8,
    carbs: 7,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Courgette",
    calories: 17,
    proteins: 1.2,
    carbs: 3.1,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  { name: "Aubergine", calories: 25, proteins: 1, carbs: 6, fats: 0.2, quantity: 1, unit: "100g" },
  {
    name: "Poivron rouge",
    calories: 31,
    proteins: 1,
    carbs: 6,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Poivron vert",
    calories: 20,
    proteins: 0.9,
    carbs: 4.6,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  { name: "Oignon", calories: 40, proteins: 1.1, carbs: 9, fats: 0.1, quantity: 1, unit: "100g" },
  { name: "Ail", calories: 149, proteins: 6.4, carbs: 33, fats: 0.5, quantity: 1, unit: "100g" },
  {
    name: "Champignons",
    calories: 22,
    proteins: 3.1,
    carbs: 3.3,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Maïs en boîte",
    calories: 86,
    proteins: 3.2,
    carbs: 18,
    fats: 1.2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Petits pois",
    calories: 81,
    proteins: 5.4,
    carbs: 14,
    fats: 0.4,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Betterave cuite",
    calories: 44,
    proteins: 1.7,
    carbs: 10,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  { name: "Radis", calories: 16, proteins: 0.7, carbs: 3.4, fats: 0.1, quantity: 1, unit: "100g" },
  { name: "Céleri", calories: 16, proteins: 0.7, carbs: 3, fats: 0.2, quantity: 1, unit: "100g" },
  {
    name: "Asperges",
    calories: 20,
    proteins: 2.2,
    carbs: 3.7,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Artichaut",
    calories: 47,
    proteins: 3.3,
    carbs: 10,
    fats: 0.2,
    quantity: 1,
    unit: "100g",
  },
  { name: "Poireau", calories: 61, proteins: 1.5, carbs: 14, fats: 0.3, quantity: 1, unit: "100g" },

  // ── Corps gras & sauces ───────────────────────────────────────────────────────
  {
    name: "Huile d'olive",
    calories: 884,
    proteins: 0,
    carbs: 0,
    fats: 100,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Huile de tournesol",
    calories: 884,
    proteins: 0,
    carbs: 0,
    fats: 100,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Huile de coco",
    calories: 862,
    proteins: 0,
    carbs: 0,
    fats: 100,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Mayonnaise",
    calories: 680,
    proteins: 1.3,
    carbs: 2.5,
    fats: 74,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Ketchup",
    calories: 101,
    proteins: 1.7,
    carbs: 25,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  { name: "Moutarde", calories: 66, proteins: 4.4, carbs: 6, fats: 3.3, quantity: 1, unit: "100g" },
  {
    name: "Sauce soja",
    calories: 53,
    proteins: 5.6,
    carbs: 8,
    fats: 0,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Sauce bolognaise",
    calories: 120,
    proteins: 8,
    carbs: 8,
    fats: 6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Sauce tomate",
    calories: 35,
    proteins: 1.5,
    carbs: 7,
    fats: 0.4,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Vinaigrette",
    calories: 462,
    proteins: 0.2,
    carbs: 5,
    fats: 50,
    quantity: 1,
    unit: "100ml",
  },
  { name: "Pesto", calories: 460, proteins: 6, carbs: 4, fats: 48, quantity: 1, unit: "100g" },

  // ── Boissons ──────────────────────────────────────────────────────────────────
  { name: "Eau", calories: 0, proteins: 0, carbs: 0, fats: 0, quantity: 1, unit: "100ml" },
  { name: "Café noir", calories: 2, proteins: 0.3, carbs: 0, fats: 0, quantity: 1, unit: "100ml" },
  {
    name: "Café latte",
    calories: 45,
    proteins: 2.5,
    carbs: 5,
    fats: 1.8,
    quantity: 1,
    unit: "100ml",
  },
  { name: "Thé nature", calories: 1, proteins: 0, carbs: 0.2, fats: 0, quantity: 1, unit: "100ml" },
  {
    name: "Jus d'orange",
    calories: 45,
    proteins: 0.7,
    carbs: 10,
    fats: 0.2,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Jus de pomme",
    calories: 46,
    proteins: 0.1,
    carbs: 11,
    fats: 0.1,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Smoothie fruits rouges",
    calories: 65,
    proteins: 1,
    carbs: 15,
    fats: 0.3,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Coca-Cola",
    calories: 42,
    proteins: 0,
    carbs: 10.6,
    fats: 0,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Coca-Cola Zero",
    calories: 1,
    proteins: 0,
    carbs: 0,
    fats: 0,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Bière blonde",
    calories: 43,
    proteins: 0.5,
    carbs: 3.6,
    fats: 0,
    quantity: 1,
    unit: "100ml",
  },
  {
    name: "Vin rouge",
    calories: 85,
    proteins: 0.1,
    carbs: 2.5,
    fats: 0,
    quantity: 1,
    unit: "100ml",
  },
  { name: "Vin blanc", calories: 77, proteins: 0.1, carbs: 1, fats: 0, quantity: 1, unit: "100ml" },

  // ── Plats complets ────────────────────────────────────────────────────────────
  {
    name: "Pâtes bolognaise",
    calories: 150,
    proteins: 8,
    carbs: 18,
    fats: 5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pâtes carbonara",
    calories: 320,
    proteins: 12,
    carbs: 35,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pâtes pesto",
    calories: 280,
    proteins: 9,
    carbs: 33,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pâtes tomate",
    calories: 140,
    proteins: 5,
    carbs: 27,
    fats: 2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pâtes 4 fromages",
    calories: 350,
    proteins: 14,
    carbs: 32,
    fats: 18,
    quantity: 1,
    unit: "100g",
  },
  { name: "Lasagnes", calories: 165, proteins: 10, carbs: 15, fats: 7, quantity: 1, unit: "100g" },
  {
    name: "Risotto",
    calories: 165,
    proteins: 4.5,
    carbs: 28,
    fats: 4.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pizza margherita",
    calories: 250,
    proteins: 11,
    carbs: 33,
    fats: 8,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pizza 4 fromages",
    calories: 290,
    proteins: 14,
    carbs: 31,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Pizza jambon",
    calories: 265,
    proteins: 13,
    carbs: 32,
    fats: 9,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Hamburger",
    calories: 295,
    proteins: 17,
    carbs: 24,
    fats: 14,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Cheeseburger",
    calories: 320,
    proteins: 18,
    carbs: 25,
    fats: 16,
    quantity: 1,
    unit: "100g",
  },
  { name: "Hot dog", calories: 285, proteins: 12, carbs: 25, fats: 16, quantity: 1, unit: "100g" },
  {
    name: "Sandwich jambon",
    calories: 220,
    proteins: 12,
    carbs: 28,
    fats: 7,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Sandwich poulet",
    calories: 210,
    proteins: 14,
    carbs: 25,
    fats: 6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Wrap poulet",
    calories: 210,
    proteins: 14,
    carbs: 25,
    fats: 6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Croque monsieur",
    calories: 320,
    proteins: 16,
    carbs: 28,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Quiche lorraine",
    calories: 290,
    proteins: 10,
    carbs: 18,
    fats: 20,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Tarte aux légumes",
    calories: 220,
    proteins: 6,
    carbs: 22,
    fats: 13,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Steak frites",
    calories: 310,
    proteins: 18,
    carbs: 25,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Poulet rôti frites",
    calories: 290,
    proteins: 20,
    carbs: 22,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  { name: "Couscous", calories: 172, proteins: 6, carbs: 36, fats: 0.6, quantity: 1, unit: "100g" },
  {
    name: "Couscous poulet",
    calories: 185,
    proteins: 12,
    carbs: 22,
    fats: 5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Tajine poulet",
    calories: 180,
    proteins: 16,
    carbs: 12,
    fats: 8,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Tajine agneau",
    calories: 210,
    proteins: 18,
    carbs: 10,
    fats: 11,
    quantity: 1,
    unit: "100g",
  },
  { name: "Ratatouille", calories: 60, proteins: 2, carbs: 8, fats: 3, quantity: 1, unit: "100g" },
  {
    name: "Gratin dauphinois",
    calories: 185,
    proteins: 4,
    carbs: 16,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Gratin de courgettes",
    calories: 120,
    proteins: 5,
    carbs: 8,
    fats: 8,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Blanquette de veau",
    calories: 165,
    proteins: 14,
    carbs: 8,
    fats: 9,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Boeuf bourguignon",
    calories: 195,
    proteins: 16,
    carbs: 6,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  { name: "Pot-au-feu", calories: 135, proteins: 14, carbs: 7, fats: 6, quantity: 1, unit: "100g" },
  {
    name: "Soupe de légumes",
    calories: 35,
    proteins: 1.5,
    carbs: 7,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Soupe à l'oignon",
    calories: 55,
    proteins: 2,
    carbs: 8,
    fats: 2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Soupe de tomates",
    calories: 45,
    proteins: 1.5,
    carbs: 9,
    fats: 1,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Velouté de butternut",
    calories: 60,
    proteins: 1.5,
    carbs: 12,
    fats: 1.5,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Salade niçoise",
    calories: 120,
    proteins: 9,
    carbs: 8,
    fats: 6,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Salade César",
    calories: 180,
    proteins: 10,
    carbs: 10,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Salade composée",
    calories: 85,
    proteins: 4,
    carbs: 8,
    fats: 4,
    quantity: 1,
    unit: "100g",
  },
  { name: "Taboulé", calories: 150, proteins: 3.5, carbs: 25, fats: 5, quantity: 1, unit: "100g" },
  { name: "Houmous", calories: 166, proteins: 8, carbs: 14, fats: 9.6, quantity: 1, unit: "100g" },
  {
    name: "Crêpe nature",
    calories: 200,
    proteins: 6,
    carbs: 30,
    fats: 7,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Crêpe Nutella",
    calories: 310,
    proteins: 5,
    carbs: 45,
    fats: 13,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Crêpe jambon fromage",
    calories: 240,
    proteins: 12,
    carbs: 22,
    fats: 12,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Galette complète",
    calories: 220,
    proteins: 11,
    carbs: 20,
    fats: 11,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Omelette jambon fromage",
    calories: 195,
    proteins: 14,
    carbs: 1,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Riz cantonais",
    calories: 175,
    proteins: 5,
    carbs: 28,
    fats: 5,
    quantity: 1,
    unit: "100g",
  },
  { name: "Nems", calories: 200, proteins: 7, carbs: 22, fats: 10, quantity: 1, unit: "100g" },
  {
    name: "Sushi (2 pièces)",
    calories: 120,
    proteins: 5,
    carbs: 20,
    fats: 2,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Poulet tikka masala",
    calories: 150,
    proteins: 15,
    carbs: 8,
    fats: 7,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Curry de légumes",
    calories: 95,
    proteins: 3,
    carbs: 12,
    fats: 4,
    quantity: 1,
    unit: "100g",
  },

  // ── Petit-déjeuner ────────────────────────────────────────────────────────────
  {
    name: "Tartine beurre confiture",
    calories: 280,
    proteins: 5,
    carbs: 42,
    fats: 10,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Tartine beurre",
    calories: 310,
    proteins: 6,
    carbs: 38,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Bowl de fruits",
    calories: 65,
    proteins: 1,
    carbs: 15,
    fats: 0.3,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Porridge",
    calories: 71,
    proteins: 2.5,
    carbs: 12,
    fats: 1.5,
    quantity: 1,
    unit: "100g",
  },
  { name: "Pancakes", calories: 227, proteins: 6, carbs: 38, fats: 6, quantity: 1, unit: "100g" },
  { name: "Gaufres", calories: 291, proteins: 8, carbs: 41, fats: 11, quantity: 1, unit: "100g" },
  {
    name: "Pain perdu",
    calories: 270,
    proteins: 8,
    carbs: 38,
    fats: 10,
    quantity: 1,
    unit: "100g",
  },

  // ── Desserts & sucreries ──────────────────────────────────────────────────────
  {
    name: "Chocolat noir",
    calories: 546,
    proteins: 5,
    carbs: 60,
    fats: 31,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Chocolat au lait",
    calories: 535,
    proteins: 7.7,
    carbs: 60,
    fats: 30,
    quantity: 1,
    unit: "100g",
  },
  { name: "Nutella", calories: 530, proteins: 6, carbs: 58, fats: 31, quantity: 1, unit: "100g" },
  {
    name: "Confiture",
    calories: 250,
    proteins: 0.5,
    carbs: 62,
    fats: 0.1,
    quantity: 1,
    unit: "100g",
  },
  { name: "Miel", calories: 304, proteins: 0.3, carbs: 82, fats: 0, quantity: 1, unit: "100g" },
  {
    name: "Glace vanille",
    calories: 207,
    proteins: 3.5,
    carbs: 24,
    fats: 11,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Glace chocolat",
    calories: 216,
    proteins: 4,
    carbs: 26,
    fats: 11,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Tarte aux pommes",
    calories: 260,
    proteins: 3,
    carbs: 38,
    fats: 11,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Gâteau au chocolat",
    calories: 400,
    proteins: 6,
    carbs: 50,
    fats: 20,
    quantity: 1,
    unit: "100g",
  },
  { name: "Madeleine", calories: 412, proteins: 6, carbs: 55, fats: 19, quantity: 1, unit: "100g" },
  { name: "Cookie", calories: 488, proteins: 6, carbs: 63, fats: 24, quantity: 1, unit: "100g" },
  { name: "Tiramisu", calories: 290, proteins: 5, carbs: 28, fats: 18, quantity: 1, unit: "100g" },
  {
    name: "Mousse au chocolat",
    calories: 280,
    proteins: 5,
    carbs: 25,
    fats: 18,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Crème brûlée",
    calories: 250,
    proteins: 4,
    carbs: 22,
    fats: 16,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Profiteroles",
    calories: 320,
    proteins: 6,
    carbs: 32,
    fats: 19,
    quantity: 1,
    unit: "100g",
  },
  { name: "Macaron", calories: 415, proteins: 5, carbs: 65, fats: 16, quantity: 1, unit: "100g" },
  {
    name: "Chips nature",
    calories: 536,
    proteins: 7,
    carbs: 53,
    fats: 34,
    quantity: 1,
    unit: "100g",
  },
  {
    name: "Biscuits secs",
    calories: 430,
    proteins: 7,
    carbs: 68,
    fats: 15,
    quantity: 1,
    unit: "100g",
  },
  { name: "Bonbons", calories: 340, proteins: 5, carbs: 77, fats: 0.1, quantity: 1, unit: "100g" },
];

// ─── Open Food Facts ─ Recherche par nom ───────────────────────────────────────────────────

export async function searchFoodByName(query: string): Promise<AIFoodItem[]> {
  // D'abord chercher dans notre base locale
  const local = LOCAL_FOODS.filter((f) =>
    f.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(
        query
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      )
  );
  if (local.length > 0) return local;

  // Sinon Open Food Facts avec meilleurs filtres
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&tagtype_0=languages&tag_contains_0=contains&tag_0=fr&fields=product_name_fr,product_name,nutriments&action=process&json=1&page_size=20&sort_by=unique_scans_n`
    );
    const data = await res.json();
    return (data.products ?? [])
      .filter((p: any) => {
        const name = (p.product_name_fr ?? p.product_name ?? "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const queryLower = query
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return (
          name.includes(queryLower) && p.nutriments?.["energy-kcal_100g"] > 0 && name.length < 60
        );
      })
      .slice(0, 8)
      .map((p: any) => ({
        name: p.product_name_fr ?? p.product_name,
        calories: Math.round(p.nutriments["energy-kcal_100g"] ?? 0),
        proteins: Math.round(p.nutriments.proteins_100g ?? 0),
        carbs: Math.round(p.nutriments.carbohydrates_100g ?? 0),
        fats: Math.round(p.nutriments.fat_100g ?? 0),
        quantity: 1,
        unit: "100g",
      }));
  } catch {
    return [];
  }
}

// ─── Open Food Facts ─ Code-barre ──────────────────────────────────────────────────────────

export async function searchBarcode(barcode: string): Promise<AIFoodItem | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    return {
      name: p.product_name_fr ?? p.product_name ?? "Produit inconnu",
      calories: Math.round(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0),
      proteins: Math.round(n.proteins_100g ?? 0),
      carbs: Math.round(n.carbohydrates_100g ?? 0),
      fats: Math.round(n.fat_100g ?? 0),
      quantity: 1,
      unit: "100g",
    };
  } catch {
    return null;
  }
}
