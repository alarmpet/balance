import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';

interface GlassViewProps extends ViewProps {
  intensity?: number; // Blur intensity in pixels
  borderRadius?: number;
  borderColor?: string;
  backgroundColor?: string;
}

export default function GlassView({
  children,
  style,
  intensity = 20,
  borderRadius = 24,
  borderColor = 'rgba(255, 255, 255, 0.42)',
  backgroundColor = 'rgba(255, 255, 255, 0.42)',
  ...props
}: GlassViewProps) {
  const isWeb = Platform.OS === 'web';

  const webStyle = isWeb
    ? {
        backdropFilter: `blur(${intensity}px)`,
        WebkitBackdropFilter: `blur(${intensity}px)`,
      }
    : {};

  return (
    <View
      style={[
        styles.glass,
        {
          borderRadius,
          borderColor,
          backgroundColor,
        },
        // @ts-ignore - Web-only backdropFilter
        webStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4
  }
});
