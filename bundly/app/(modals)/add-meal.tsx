import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "@/stores/themeStore";
import { useAddMeal } from "@/features/nutrition/hooks";
import {
  searchFoodByName,
  searchBarcode,
  MEAL_TYPES,
  type AIFoodItem,
  type MealTypeKey,
} from "@/features/nutrition/api";

type Mode = "choose" | "text" | "photo" | "barcode" | "review";

export default function AddMealModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addMeal = useAddMeal();

  const [mode, setMode] = useState<Mode>("choose");
  const [mealType, setMealType] = useState<MealTypeKey>("lunch");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AIFoodItem[]>([]);
  const [searchResults, setSearchResults] = useState<AIFoodItem[]>([]);
  const [shared, setShared] = useState(false);

  const totalCalories = items.reduce((acc, i) => acc + i.calories * i.quantity, 0);

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleTextSearch() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const results = await searchFoodByName(description);
      if (results.length === 0) {
        Alert.alert("Aucun résultat", "Essaie avec un autre nom ou en anglais.");
        return;
      }
      setSearchResults(results);
    } catch {
      Alert.alert("Erreur", "Impossible de rechercher cet aliment.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoAnalyze() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;
    Alert.alert(
      "Non disponible",
      "L'analyse photo nécessite l'API IA. Utilise la recherche par texte ou code-barre."
    );
  }

  async function handleBarcodeSearch() {
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const food = await searchBarcode(barcode.trim());
      if (!food) {
        Alert.alert("Produit non trouvé", "Ce code-barre n'est pas dans la base Open Food Facts.");
        return;
      }
      setItems([food]);
      setMode("review");
    } catch {
      Alert.alert("Erreur", "Impossible de rechercher ce produit.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (items.length === 0) return;
    await addMeal.mutateAsync({ mealType, items, shared });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bgCard }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: theme.text }}>
              {mode === "review" ? "Vérifier le repas" : "Ajouter un repas"}
            </Text>
            <TouchableOpacity
              onPress={() => (mode !== "choose" ? setMode("choose") : router.back())}
            >
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Type de repas */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 8 }}>
              Type de repas
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {MEAL_TYPES.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMealType(m.key)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: mealType === m.key ? m.color : theme.borderStrong,
                    backgroundColor: mealType === m.key ? `${m.color}15` : theme.bgSecondary,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "500",
                      color: mealType === m.key ? m.color : theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode sélection */}
          {mode === "choose" && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 4 }}>
                Comment ajouter ce repas ?
              </Text>

              <TouchableOpacity
                onPress={() => setMode("text")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#F5F3FF",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "#8B5CF6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🔍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B5CF6" }}>
                    Rechercher un aliment
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    Base Open Food Facts — millions de produits
                  </Text>
                </View>
                <Text style={{ color: "#8B5CF6" }}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode("barcode")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#ECFDF5",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "#1D9E75",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>📊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1D9E75" }}>
                    Code-barre
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    Scanne ou entre le code d&apos;un produit
                  </Text>
                </View>
                <Text style={{ color: "#1D9E75" }}>›</Text>
              </TouchableOpacity>

              {items.length > 0 && (
                <TouchableOpacity
                  onPress={() => setMode("review")}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: "#FFF1F5",
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "#FF6B9D",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>✅</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#FF6B9D" }}>
                      Valider ({items.length} aliment{items.length > 1 ? "s" : ""})
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                      {Math.round(totalCalories)} kcal au total
                    </Text>
                  </View>
                  <Text style={{ color: "#FF6B9D" }}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Mode texte — recherche */}
          {mode === "text" && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: theme.bgSecondary,
                    borderWidth: 1,
                    borderColor: theme.borderStrong,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    height: 48,
                    color: theme.text,
                    fontSize: 15,
                  }}
                  placeholder="Ex: poulet, riz, yaourt..."
                  placeholderTextColor={theme.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={handleTextSearch}
                />
                <TouchableOpacity
                  onPress={handleTextSearch}
                  disabled={!description.trim() || loading}
                  activeOpacity={0.8}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: description.trim() ? "#8B5CF6" : theme.bgSecondary,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{ fontSize: 18 }}>🔍</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Résultats */}
              {searchResults.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    Appuie sur + pour ajouter :
                  </Text>
                  {searchResults.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setItems((prev: AIFoodItem[]) => [...prev, item]);
                        setDescription("");
                        setSearchResults([]);
                      }}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: "500", color: theme.text }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                          P:{item.proteins}g G:{item.carbs}g L:{item.fats}g · {item.unit}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#8B5CF6" }}>
                        {item.calories} kcal
                      </Text>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: "#8B5CF6",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 18, fontWeight: "300" }}>+</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Items ajoutés */}
              {items.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    Ajoutés ({items.length}) :
                  </Text>
                  {items.map((item: AIFoodItem, i: number) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#F5F3FF",
                        borderRadius: 12,
                        padding: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 13, color: theme.text }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#8B5CF6" }}>
                        {item.calories} kcal
                      </Text>
                      <TouchableOpacity onPress={() => removeItem(i)} activeOpacity={0.6}>
                        <Text style={{ color: theme.textMuted }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={() => setMode("review")}
                    activeOpacity={0.8}
                    style={{
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#8B5CF6",
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      Valider ({items.length} aliment{items.length > 1 ? "s" : ""})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Mode code-barre */}
          {mode === "barcode" && (
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                Entre le code-barre du produit :
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.bgSecondary,
                  borderWidth: 1,
                  borderColor: theme.borderStrong,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  height: 52,
                  color: theme.text,
                  fontSize: 18,
                  fontWeight: "600",
                  textAlign: "center",
                  letterSpacing: 4,
                }}
                placeholder="3017620422003"
                placeholderTextColor={theme.textMuted}
                value={barcode}
                onChangeText={setBarcode}
                keyboardType="number-pad"
                autoFocus
              />
              <TouchableOpacity
                onPress={handleBarcodeSearch}
                disabled={!barcode.trim() || loading}
                activeOpacity={0.8}
                style={{
                  height: 52,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: barcode.trim() ? "#1D9E75" : theme.bgSecondary,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: barcode.trim() ? "white" : theme.textMuted,
                    }}
                  >
                    Rechercher
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Mode review */}
          {mode === "review" && (
            <View style={{ gap: 12 }}>
              <View
                style={{
                  backgroundColor: "#F5F3FF",
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "500", color: "#8B5CF6" }}>Total</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: "#8B5CF6" }}>
                  {Math.round(totalCalories)} kcal
                </Text>
              </View>

              {items.map((item: AIFoodItem, i: number) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.bgSecondary,
                    borderRadius: 14,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                      {item.quantity} {item.unit} · P:{item.proteins}g G:{item.carbs}g L:{item.fats}
                      g
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#8B5CF6" }}>
                    {Math.round(item.calories * item.quantity)} kcal
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(i)} activeOpacity={0.6}>
                    <Text style={{ color: theme.textMuted, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setShared(!shared)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: theme.bgSecondary,
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: shared ? "#FF6B9D" : theme.borderStrong,
                    backgroundColor: shared ? "#FF6B9D" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {shared && (
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>✓</Text>
                  )}
                </View>
                <Text style={{ fontSize: 14, color: theme.text }}>Repas partagé 💑</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                disabled={items.length === 0 || addMeal.isPending}
                activeOpacity={0.8}
                style={{
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#8B5CF6",
                  marginTop: 8,
                }}
              >
                {addMeal.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                    Enregistrer ce repas
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
