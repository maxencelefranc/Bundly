import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import { useVehicles, useDeleteVehicle, useUpdateVehicle } from "@/features/vehicles/hooks";
import { daysUntilService, type Vehicle } from "@/features/vehicles/api";

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const theme = useTheme();
  const remove = useDeleteVehicle();
  const update = useUpdateVehicle();
  const [expanded, setExpanded] = useState(false);
  const [mileage, setMileage] = useState(String(vehicle.mileage ?? ""));
  const days = daysUntilService(vehicle.next_service);
  const serviceSoon = days !== null && days <= 30;

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: serviceSoon ? "rgba(245,158,11,0.2)" : theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: days !== null ? 10 : 0,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#F8FAFC",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="car-outline" size={22} color="#64748B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>
            {vehicle.make} {vehicle.model ?? ""}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            {[
              vehicle.year,
              vehicle.plate,
              vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove.mutate(vehicle.id)} activeOpacity={0.6}>
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {days !== null && (
        <View
          style={{
            backgroundColor: serviceSoon ? "#FFFBEB" : theme.bgSecondary,
            borderRadius: 10,
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons
            name="construct-outline"
            size={14}
            color={serviceSoon ? "#F59E0B" : "#64748B"}
          />
          <Text
            style={{ fontSize: 13, color: serviceSoon ? "#F59E0B" : "#64748B", fontWeight: "500" }}
          >
            {days <= 0
              ? "Entretien en retard"
              : serviceSoon
                ? `Entretien dans ${days}j`
                : `Prochain entretien dans ${days}j`}
          </Text>
        </View>
      )}

      {expanded && (
        <View style={{ marginTop: 12, gap: 10 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: theme.textMuted,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Mettre à jour le kilométrage
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: theme.bgSecondary,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 44,
                color: theme.text,
                fontSize: 15,
              }}
              placeholder="Ex: 50000"
              placeholderTextColor={theme.textMuted}
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={() =>
                update.mutate({ id: vehicle.id, updates: { mileage: parseInt(mileage) } })
              }
              activeOpacity={0.8}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#64748B",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function VehiclesScreen() {
  const theme = useTheme();
  const { data: vehicles, isLoading } = useVehicles();

  return (
    <ScreenLayout
      title="Véhicules"
      subtitle={`${vehicles?.length ?? 0} véhicule(s)`}
      color="#64748B"
      icon="car-outline"
      onAdd={() => router.push("/(modals)/add-vehicle")}
    >
      {isLoading ? (
        <ActivityIndicator color="#64748B" style={{ marginTop: 40 }} />
      ) : vehicles?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#F8FAFC",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="car-outline" size={32} color="#64748B" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucun véhicule
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Ajoutez votre premier véhicule
          </Text>
        </View>
      ) : (
        vehicles?.map((v) => <VehicleCard key={v.id} vehicle={v} />)
      )}
    </ScreenLayout>
  );
}
