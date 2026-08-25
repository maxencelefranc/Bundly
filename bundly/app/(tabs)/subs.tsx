import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import { useSubscriptions, useDeleteSubscription } from "@/features/subscriptions/hooks";
import {
  SUB_CATEGORIES,
  daysUntilRenewal,
  totalMonthly,
  type Subscription,
} from "@/features/subscriptions/api";

function SubCard({ sub }: { sub: Subscription }) {
  const theme = useTheme();
  const remove = useDeleteSubscription();
  const days = daysUntilRenewal(sub.renewal_date);
  const category = SUB_CATEGORIES.find((c) => c.key === sub.category);

  return (
    <View
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
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: "#F5F3FF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 22 }}>{category?.emoji ?? "📦"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>{sub.name}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
          {sub.amount && (
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{sub.amount}€/mois</Text>
          )}
          {days !== null && (
            <Text style={{ fontSize: 12, color: days <= 7 ? "#F59E0B" : theme.textSecondary }}>
              Renouvellement {days <= 0 ? "aujourd'hui" : `dans ${days}j`}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => remove.mutate(sub.id)} activeOpacity={0.6}>
        <Ionicons name="close" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function SubsScreen() {
  const theme = useTheme();
  const { data: subs, isLoading } = useSubscriptions();
  const total = totalMonthly(subs ?? []);

  return (
    <ScreenLayout
      title="Abonnements"
      subtitle={`${subs?.length ?? 0} abonnements · ${total.toFixed(2)}€/mois`}
      color="#8B5CF6"
      icon="card-outline"
      onAdd={() => router.push("/(modals)/add-subscription")}
    >
      {total > 0 && (
        <View
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderWidth: 0.5,
            borderColor: "rgba(139,92,246,0.15)",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>Total mensuel</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#8B5CF6" }}>
            {total.toFixed(2)}€
          </Text>
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator color="#8B5CF6" style={{ marginTop: 40 }} />
      ) : subs?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#F5F3FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="card-outline" size={32} color="#8B5CF6" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucun abonnement
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Suivez vos dépenses récurrentes
          </Text>
        </View>
      ) : (
        subs?.map((s) => <SubCard key={s.id} sub={s} />)
      )}
    </ScreenLayout>
  );
}
