import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Card } from 'src/components/ui/Card';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { Button } from 'src/components/ui/Button';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { ensureDefaultList, fetchTasks, type Task } from 'src/features/tasks/tasksApi';
import { scheduleLocal } from 'src/lib/notifications';
import { useAuth } from 'src/lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const t = useTokens();
  const { profile } = useAuth();
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        const list = await ensureDefaultList();
        const data = await fetchTasks(list.id);
        setTasks(data);
      } finally {
        setTasksLoading(false);
      }
    };
    loadTasks();
  }, []);

  const undone = useMemo(() => tasks.filter(tk => !tk.done), [tasks]);
  const myId = profile?.id ?? null;
  const mineUndone = useMemo(() => myId ? undone.filter(tk => tk.assigned_to === myId) : [], [undone, myId]);
  const unassignedUndone = useMemo(() => undone.filter(tk => !tk.assigned_to), [undone]);
  const upcoming = useMemo(() => undone.slice(0, 3), [undone]);

  // Fake data placeholders to illustrate the layout; wire real data later
  const metrics = [
    { icon: 'heart', label: 'Prochaines règles', value: '13j', note: '23 nov.' },
    { icon: 'medkit', label: 'Traitement', value: '1/2', note: 'pris aujourd’hui' },
    { icon: 'paw', label: 'Minou', value: '4.2kg', note: '45% croquettes' },
    { icon: 'cart', label: 'Courses', value: '125€', note: '3 articles' }
  ];

  const events = [
    { title: 'Prise de sang thyroïde', date: 'mar. 11 nov, 09:30', tag: 'médical' },
    { title: 'Entretien d’embauche - StartupCo', date: 'mer. 12 nov, 10:30', tag: 'professionnel' },
    { title: 'Orthodontiste', date: 'jeu. 13 nov, 14:00', tag: 'médical' }
  ];

  const quick = [
    { icon: 'water', title: "J’ai mes règles", subtitle: 'Notifier mon partenaire' },
    { icon: 'bandage', title: 'Prendre Complément vitamine D', subtitle: 'Marquer comme pris' },
    { icon: 'flame', title: 'Distribution manuelle', subtitle: 'Prochaine: 12:00' },
    { icon: 'journal', title: 'Journal quotidien', subtitle: 'Partager mes émotions' },
    { icon: 'add', title: 'Ajouter une course', subtitle: '3 articles en cours' }
  ];

  const notifications = [
    { text: "N’oubliez pas votre prise de sang demain à 9h30", time: '10 nov, 08:16' },
    { text: 'Il est temps de prendre votre Levothyrox', time: '10 nov, 08:00' },
    { text: 'Les règles de Marie sont prévues dans 13 jours', time: '10 nov, 08:16' }
  ];

  return (
    <AppContainer scroll>
      <FloatingNav />
      {/* Spacer to keep content clear of the floating nav */}
      <View style={{ height: 68 }} />
      {/* Top title */}
      <Animated.View entering={FadeInDown} layout={Layout.springify()}>
        <ThemedText variant="h1" style={[styles.title, { marginBottom: 18 }]}>Accueil</ThemedText>
      </Animated.View>

      {/* Bouton test notification locale */}
      <View style={{ marginBottom: 12 }}>
        <Button
          title="Tester notification locale (5s)"
          variant="outline"
          onPress={() => scheduleLocal('Test', 'Notification locale déclenchée', 5)}
        />
      </View>

      {/* Metric cards */}
      <Animated.View entering={FadeInDown.delay(60)} layout={Layout.springify()} style={{ marginBottom: 18 }}>
        <View style={styles.metricGrid}>
          {metrics.map((m, i) => (
            <Card
              key={i}
              style={[
                styles.metricCard,
                i % 2 === 0 ? { marginRight: '2%' } : null,
                { paddingVertical: 14 },
                t.shadow.card
              ] as any}
            >
              <View style={styles.metricHeader}>
                <View style={[styles.iconCircle, { backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5' }]}>
                  <Ionicons name={m.icon as any} size={18} color={t.color.text} />
                </View>
              </View>
              <ThemedText variant="h2">{m.value}</ThemedText>
              <ThemedText variant="small" style={{ color: t.color.muted }}>{m.label}</ThemedText>
              <ThemedText variant="small" style={{ color: t.color.muted }}>{m.note}</ThemedText>
            </Card>
          ))}
        </View>
      </Animated.View>

      {/* Tasks widget */}
      <Animated.View entering={FadeInUp.delay(90)} layout={Layout.springify()}>
        <Card style={{ marginBottom: 18 }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h2">Tâches</ThemedText>
            <Button title="Voir" variant="outline" onPress={() => router.push('/(tabs)/tasks')} />
          </View>
          {tasksLoading ? (
            <View style={{ paddingVertical: 6 }}><ThemedText style={{ color: t.color.muted }}>Chargement…</ThemedText></View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <View style={[styles.pill, { borderColor: t.color.border }]}>
                  <ThemedText variant="small" style={{ color: t.color.muted }}>À faire: {undone.length}</ThemedText>
                </View>
                <View style={[styles.pill, { borderColor: t.color.border }]}>
                  <ThemedText variant="small" style={{ color: t.color.muted }}>Pour moi: {mineUndone.length}</ThemedText>
                </View>
                <View style={[styles.pill, { borderColor: t.color.border }]}>
                  <ThemedText variant="small" style={{ color: t.color.muted }}>Non assignées: {unassignedUndone.length}</ThemedText>
                </View>
              </View>
              {upcoming.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {upcoming.map((tk) => (
                    <View key={tk.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.iconCircleSmall, { backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5' }]}>
                        <Ionicons name={tk.done ? 'checkmark' : 'square-outline'} size={16} color={t.color.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText numberOfLines={1}>{tk.title}</ThemedText>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                          {tk.category ? (
                            <View style={[styles.pill, { borderColor: t.color.border }]}>
                              <ThemedText variant="small" style={{ color: t.color.muted }}>{tk.category}</ThemedText>
                            </View>
                          ) : null}
                          {tk.is_routine ? (
                            <View style={[styles.pill, { borderColor: t.color.border }]}>
                              <ThemedText variant="small" style={{ color: t.color.muted }}>{tk.routine_every_days === 1 ? 'Quotidien' : tk.routine_every_days === 7 ? 'Hebdomadaire' : `Tous ${tk.routine_every_days} j`}</ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText style={{ color: t.color.muted }}>Aucune tâche à afficher</ThemedText>
              )}
            </>
          )}
        </Card>
      </Animated.View>

      {/* Upcoming events */}
      <Animated.View entering={FadeInUp.delay(100)} layout={Layout.springify()}>
        <Card style={{ marginBottom: 18 }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h2">Événements à venir</ThemedText>
            <ThemedText variant="small" style={{ color: t.color.muted }}>7 prochains jours</ThemedText>
          </View>
          <View style={{ gap: 10 }}>
            {events.map((e, i) => (
              <View key={i} style={styles.eventRow}>
                <View style={[styles.iconCircleSmall, { backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5' }]}>
                  <Ionicons name="calendar" size={16} color={t.color.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText>{e.title}</ThemedText>
                  <ThemedText variant="small" style={{ color: t.color.muted }}>{e.date}</ThemedText>
                </View>
                <View style={[styles.pill, { borderColor: t.color.border }]}> 
                  <ThemedText variant="small" style={{ color: t.color.muted }}>{e.tag}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={FadeInUp.delay(120)} layout={Layout.springify()}>
        <Card style={{ marginBottom: 18 }}>
          <ThemedText variant="h2" style={{ marginBottom: 8 }}>Actions rapides</ThemedText>
          <View style={{ gap: 8 }}>
            {quick.map((q, i) => (
              <View key={i} style={styles.actionRow}>
                <View style={[styles.iconCircleSmall, { backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5' }]}>
                  <Ionicons name={q.icon as any} size={16} color={t.color.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText>{q.title}</ThemedText>
                  <ThemedText variant="small" style={{ color: t.color.muted }}>{q.subtitle}</ThemedText>
                </View>
                <Button title="Ouvrir" variant="outline" onPress={() => {}} />
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      {/* Notifications and finances */}
      <Animated.View entering={FadeInUp.delay(140)} layout={Layout.springify()}>
        <Card style={{ marginBottom: 18 }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h2">Notifications récentes</ThemedText>
            <ThemedText variant="small" style={{ color: t.color.muted }}>Voir tout</ThemedText>
          </View>
          <View style={{ gap: 10, marginBottom: 6 }}>
            {notifications.map((n, i) => (
              <View key={i} style={styles.notifRow}>
                <View style={[styles.dot, { backgroundColor: t.color.primary }]} />
                <View style={{ flex: 1 }}>
                  <ThemedText>{n.text}</ThemedText>
                  <ThemedText variant="small" style={{ color: t.color.muted }}>{n.time}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(160)} layout={Layout.springify()}>
        <Card>
          <ThemedText variant="h2" style={{ marginBottom: 8 }}>Finances partagées</ThemedText>
          <FinanceRow name="Marie" value={110.8} color={t.color.text} />
          <FinanceRow name="Alex" value={13.99} color={t.color.muted} />
          <View style={{ marginTop: 4 }}>
            <ThemedText>Total <ThemedText style={{ fontWeight: '700' }}>124.79€</ThemedText></ThemedText>
          </View>
        </Card>
      </Animated.View>
    </AppContainer>
  );
}

const FinanceRow = ({ name, value, color }: { name: string; value: number; color: string }) => {
  const t = useTokens();
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <ThemedText>{name}</ThemedText>
        <ThemedText style={{ fontWeight: '700' }}>{value.toFixed(2)}€</ThemedText>
      </View>
      <View style={{ height: 8, backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, (value / 125) * 100)}%`, height: '100%', backgroundColor: t.color.text }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { marginBottom: 12 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricCard: {
    flexBasis: '49%',
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
    paddingVertical: 12
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  }
});
