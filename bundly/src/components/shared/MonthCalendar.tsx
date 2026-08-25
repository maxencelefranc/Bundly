import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/themeStore";

export interface CalendarMarker {
  color: string;
}

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (next: Date) => void;
  markersByDate: Record<string, CalendarMarker[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function dateKey(year: number, month1To12: number, day: number): string {
  return `${year}-${String(month1To12).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function localDateKey(d: Date): string {
  return dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Parses a "YYYY-MM-DD" string into a local Date (no UTC round-trip, so
 * `Date#setDate` stays safe regardless of the device's timezone). */
export function dateFromParts(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysStr(str: string, n: number): string {
  const d = dateFromParts(str);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

export function eachDayKey(startStr: string, endStr: string): string[] {
  const cursor = dateFromParts(startStr);
  const end = dateFromParts(endStr);
  const keys: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    keys.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function buildGrid(year: number, monthIndex: number): (Date | null)[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (firstOfMonth.getDay() + 6) % 7; // Monday-first offset

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, monthIndex, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function MonthCalendar({
  month,
  onMonthChange,
  markersByDate,
  selectedDate,
  onSelectDate,
}: MonthCalendarProps) {
  const theme = useTheme();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const cells = buildGrid(year, monthIndex);
  const todayKey = localDateKey(new Date());

  const label = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 18,
        padding: 16,
        borderWidth: 0.5,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: theme.text,
            textTransform: "capitalize",
          }}
        >
          {label}
        </Text>
        <TouchableOpacity
          onPress={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row" }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ width: `${100 / 7}%`, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "500" }}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
        {cells.map((cellDate, i) => {
          if (!cellDate) {
            return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }
          const key = localDateKey(cellDate);
          const markers = markersByDate[key] ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;

          return (
            <TouchableOpacity
              key={i}
              onPress={() => onSelectDate(key)}
              activeOpacity={0.7}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected ? theme.brand : "transparent",
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                  borderColor: theme.brand,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isToday || isSelected ? "700" : "400",
                    color: isSelected ? "white" : theme.text,
                  }}
                >
                  {cellDate.getDate()}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 2, height: 6, marginTop: 2 }}>
                {markers.slice(0, 3).map((m, mi) => (
                  <View
                    key={mi}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSelected ? "white" : m.color,
                    }}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
