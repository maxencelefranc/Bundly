import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { ItemCard } from "@/components/shared/ItemCard";
import { useTheme } from "@/stores/themeStore";
import {
  useShoppingList,
  useShoppingItems,
  useAddItem,
  useTogglePicked,
  useDeleteItem,
  useClearPicked,
} from "@/features/shopping/hooks";

export default function ShoppingScreen() {
  const theme = useTheme();
  const { data: list } = useShoppingList();
  const { data: items, isLoading } = useShoppingItems(list?.id);
  const addItem = useAddItem(list?.id);
  const toggle = useTogglePicked(list?.id);
  const remove = useDeleteItem(list?.id);
  const clear = useClearPicked(list?.id);
  const [text, setText] = useState("");

  const pending = items?.filter((i) => !i.picked) ?? [];
  const picked = items?.filter((i) => i.picked) ?? [];

  async function handleAdd() {
    if (!text.trim()) return;
    await addItem.mutateAsync({ text: text.trim() });
    setText("");
  }

  return (
    <ScreenLayout
      title="Courses"
      subtitle={`${pending.length} à acheter${picked.length > 0 ? ` · ${picked.length} dans le panier` : ""}`}
      color="#1D9E75"
      icon="cart-outline"
    >
      {/* Input */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: theme.bgCard,
            borderWidth: 0.5,
            borderColor: theme.borderStrong,
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 48,
            color: theme.text,
            fontSize: 15,
          }}
          placeholder="Ajouter un article..."
          placeholderTextColor={theme.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={!text.trim()}
          activeOpacity={0.8}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: text.trim() ? "#1D9E75" : theme.bgSecondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={22} color={text.trim() ? "white" : theme.textMuted} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#1D9E75" style={{ marginTop: 40 }} />
      ) : (
        <>
          {pending.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.textMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                À acheter
              </Text>
              {pending.map((i) => (
                <ItemCard
                  key={i.id}
                  title={i.text}
                  checked={false}
                  onCheck={() => toggle.mutate({ id: i.id, picked: true })}
                  onDelete={() => remove.mutate(i.id)}
                  checkColor="#1D9E75"
                />
              ))}
            </View>
          )}

          {picked.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.textMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Dans le panier
              </Text>
              {picked.map((i) => (
                <ItemCard
                  key={i.id}
                  title={i.text}
                  checked={true}
                  onCheck={() => toggle.mutate({ id: i.id, picked: false })}
                  onDelete={() => remove.mutate(i.id)}
                  checkColor="#1D9E75"
                />
              ))}
              <TouchableOpacity
                onPress={() => clear.mutate()}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#ECFDF5",
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                  marginTop: 8,
                  borderWidth: 0.5,
                  borderColor: "rgba(29,158,117,0.15)",
                }}
              >
                <Text style={{ color: "#1D9E75", fontWeight: "600", fontSize: 14 }}>
                  Vider le panier · +25 XP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {items?.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: "#ECFDF5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="cart-outline" size={32} color="#1D9E75" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
                Liste vide
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                Ajoutez vos articles ci-dessus
              </Text>
            </View>
          )}
        </>
      )}
    </ScreenLayout>
  );
}
