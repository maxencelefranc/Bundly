import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAppStore } from "@/stores/appStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

// Keeps the last-known data readable offline (e.g. tasks, dates, treatments)
// instead of showing blank screens while the network reconnects. Mutations
// still require a live connection — this only persists what's already been
// fetched, it doesn't queue writes made while offline.
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "bundly-query-cache",
});

export default function RootLayout() {
  const loadSession = useAppStore((s) => s.loadSession);
  const isLoading = useAppStore((s) => s.isLoading);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
        </Stack>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
