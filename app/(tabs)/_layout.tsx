import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>Editor</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="editor">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>Editor</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="preview">
        <Icon sf={{ default: "globe", selected: "globe" }} />
        <Label>Preview</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="terminal">
        <Icon sf={{ default: "terminal", selected: "terminal.fill" }} />
        <Label>Terminal</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ai">
        <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
        <Label>AI</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 16,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: isWeb ? 12 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="editor"
        options={{
          title: "Editor",
          headerTitle: "Code Editor",
          tabBarIcon: ({ color }) => (
            <Feather name="code" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: "Preview",
          headerTitle: "HTML Preview",
          tabBarIcon: ({ color }) => (
            <Feather name="globe" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="terminal"
        options={{
          title: "Terminal",
          headerTitle: "Terminal",
          headerStyle: { backgroundColor: "#111111" },
          headerTintColor: "#00d4aa",
          tabBarIcon: ({ color }) => (
            <Feather name="terminal" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          headerTitle: "AI Assistant",
          tabBarIcon: ({ color }) => (
            <Feather name="cpu" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({});
