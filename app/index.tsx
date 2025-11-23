import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from 'src/lib/auth';
import { View, ActivityIndicator } from 'react-native';
import { initNotifications } from 'src/lib/notifications';

export default function Index() {
  const { loading, session } = useAuth();
  // Initialise les notifications (locales toujours possibles, push distantes seulement en build dev)
  useEffect(() => {
    initNotifications();
  }, []);
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={session ? '/(tabs)/dashboard' : '/(auth)/signin'} />;
}
