import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from './ThemeProvider';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Provider = 'google' | 'apple';

export const SocialButton: React.FC<{
  provider: Provider;
  onPress?: () => void;
  style?: ViewStyle;
}> = ({ provider, onPress, style }) => {
  const t = useTokens();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onIn = () => { scale.value = withSpring(0.96, { stiffness: 300, damping: 20 }); };
  const onOut = () => { scale.value = withSpring(1, { stiffness: 200, damping: 18 }); };

  const iconName = provider === 'google' ? 'logo-google' : 'logo-apple';
  const iconColor = provider === 'google' ? '#EA4335' : '#000000';

  return (
    <Animated.View style={[{ borderRadius: 9999 }, aStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.color.surface,
          borderWidth: 1,
          borderColor: t.color.border,
          ...(style as object)
        }}
      >
        <Ionicons name={iconName as any} size={22} color={iconColor} />
      </Pressable>
    </Animated.View>
  );
};
