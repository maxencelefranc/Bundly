import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { tokens, type Tokens } from 'src/theme/tokens';

const ThemeContext = createContext<Tokens>(tokens('light'));

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme();
  const theme = useMemo(() => tokens(scheme === 'dark' ? 'dark' : 'light'), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).color;
export const useTokens = () => useContext(ThemeContext);
