import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

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
      {/* 네이티브: 진짜 프로스티드 글래스(BlurView). 웹은 위 backdropFilter 사용. */}
      {!isWeb && (
        <BlurView
          intensity={Math.min(100, intensity * 2)}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
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
