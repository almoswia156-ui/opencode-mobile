import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { WebView } from "react-native-webview";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "opencode_editor_content";

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>OpenCode Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1e1e2e;
      color: #cdd6f4;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #313244;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 400px;
      width: 100%;
    }
    h1 { color: #00d4aa; font-size: 28px; margin-bottom: 12px; }
    p { color: #a6adc8; line-height: 1.6; }
    .hint { margin-top: 20px; font-size: 12px; color: #6c7086; }
  </style>
</head>
<body>
  <div class="card">
    <h1>HTML Preview</h1>
    <p>Switch to the <strong>Editor</strong> tab, select <strong>html</strong>, write your HTML and come back here to preview it live.</p>
    <p class="hint">Your latest saved HTML will appear here.</p>
  </div>
</body>
</html>`;

export default function PreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHtml = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && saved.toLowerCase().includes("<html")) {
        setHtml(saved);
      } else {
        setHtml(DEFAULT_HTML);
      }
    } catch {
      setHtml(DEFAULT_HTML);
    }
  };

  useEffect(() => {
    loadHtml();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadHtml, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHtml();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(false);
  };

  const handleReload = () => {
    webViewRef.current?.reload();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 67,
            paddingBottom: insets.bottom + 34,
          },
        ]}
      >
        <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.topBarLeft}>
            <View style={[styles.dot, { backgroundColor: "#ff5f56" }]} />
            <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
            <View style={[styles.dot, { backgroundColor: "#27c93f" }]} />
          </View>
          <Text style={[styles.topBarTitle, { color: colors.mutedForeground }]}>
            HTML Preview
          </Text>
          <View style={styles.topBarRight}>
            <Text style={[styles.switchLabel, { color: colors.mutedForeground }]}>
              Auto
            </Text>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryForeground}
            />
          </View>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={[styles.webContainer, { borderColor: colors.border }]}>
            <iframe
              srcDoc={html}
              style={{
                width: "100%",
                height: 500,
                border: "none",
                borderRadius: 8,
              }}
              title="HTML Preview"
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.topBarLeft}>
          <View style={[styles.dot, { backgroundColor: "#ff5f56" }]} />
          <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
          <View style={[styles.dot, { backgroundColor: "#27c93f" }]} />
        </View>
        <Text style={[styles.topBarTitle, { color: colors.mutedForeground }]}>
          Live Preview
        </Text>
        <View style={styles.topBarRight}>
          <Text style={[styles.switchLabel, { color: colors.mutedForeground }]}>
            Auto
          </Text>
          <Switch
            value={autoRefresh}
            onValueChange={(v) => {
              setAutoRefresh(v);
              Haptics.selectionAsync();
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.primaryForeground}
          />
          <TouchableOpacity
            onPress={handleReload}
            style={[styles.reloadBtn, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.reloadText, { color: colors.foreground }]}>
              ↺
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={[styles.loadingBar, { backgroundColor: colors.primary }]} />
      )}

      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarLeft: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topBarTitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 11,
  },
  reloadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  reloadText: {
    fontSize: 16,
  },
  loadingBar: {
    height: 2,
    width: "100%",
    opacity: 0.8,
  },
  webview: {
    flex: 1,
  },
  webContainer: {
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
});
