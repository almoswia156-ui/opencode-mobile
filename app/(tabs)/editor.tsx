import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CodeEditor } from "@/components/CodeEditor";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "opencode_editor_content";
const STORAGE_LANG_KEY = "opencode_editor_lang";

const LANGUAGES = ["javascript", "html", "css", "python", "typescript", "json"] as const;
type Language = (typeof LANGUAGES)[number];

const SNIPPETS: Record<Language, string> = {
  javascript: `// JavaScript Snippet\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n  <style>\n    body { font-family: sans-serif; padding: 20px; }\n    h1 { color: #00d4aa; }\n  </style>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Edit me and see the live preview!</p>\n</body>\n</html>`,
  css: `/* CSS Snippet */\nbody {\n  margin: 0;\n  font-family: -apple-system, sans-serif;\n  background: #1e1e2e;\n  color: #cdd6f4;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}`,
  python: `# Python Snippet\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nfor i in range(10):\n    print(f"fib({i}) = {fibonacci(i)}")`,
  typescript: `// TypeScript Snippet\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nfunction formatUser(user: User): string {\n  return \`[\${user.id}] \${user.name} <\${user.email}>\`;\n}\n\nconst user: User = { id: 1, name: "Alice", email: "alice@example.com" };\nconsole.log(formatUser(user));`,
  json: `{\n  "name": "opencode-mobile",\n  "version": "1.0.0",\n  "description": "A mobile coding assistant",\n  "features": [\n    "Code Editor",\n    "HTML Preview",\n    "Terminal",\n    "AI Assistant"\n  ]\n}`,
};

export default function EditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState(SNIPPETS["javascript"]);
  const [language, setLanguage] = useState<Language>("javascript");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedContent, savedLang] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_LANG_KEY),
        ]);
        if (savedContent) setContent(savedContent);
        if (savedLang && LANGUAGES.includes(savedLang as Language)) {
          setLanguage(savedLang as Language);
        }
      } catch {}
    })();
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, content),
        AsyncStorage.setItem(STORAGE_LANG_KEY, language),
      ]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert("Error", "Could not save file.");
    }
  }, [content, language]);

  const handleInsertSnippet = useCallback(() => {
    setContent(SNIPPETS[language]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [language]);

  const handleClear = useCallback(() => {
    Alert.alert("Clear Editor", "This will clear all content. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setContent("");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        },
      },
    ]);
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "web" ? 67 : 0}
    >
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? insets.top + 8 : 8,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.langTabs}
        >
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => {
                setLanguage(lang);
                Haptics.selectionAsync();
              }}
              style={[
                styles.langTab,
                {
                  backgroundColor:
                    language === lang ? colors.primary : colors.secondary,
                  borderColor: language === lang ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.langTabText,
                  {
                    color:
                      language === lang
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    fontWeight: language === lang ? "600" : "400",
                  },
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            onPress={handleInsertSnippet}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.iconBtnText, { color: colors.mutedForeground }]}>
              {"</>"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveBtn,
              { backgroundColor: saved ? colors.codeString : colors.primary },
            ]}
          >
            <Text
              style={[styles.saveBtnText, { color: colors.primaryForeground }]}
            >
              {saved ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.editorScroll}
        contentContainerStyle={[
          styles.editorContent,
          {
            paddingBottom:
              Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 80,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <CodeEditor
          value={content}
          onChange={setContent}
          language={language}
          minHeight={480}
        />
        <View style={styles.stats}>
          <Text style={[styles.stat, { color: colors.mutedForeground }]}>
            {content.split("\n").length} lines
          </Text>
          <Text style={[styles.stat, { color: colors.mutedForeground }]}>
            {content.length} chars
          </Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.stat, { color: colors.destructive }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  langTabs: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 8,
  },
  langTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  langTabText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  toolbarActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  iconBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  editorScroll: {
    flex: 1,
  },
  editorContent: {
    padding: 12,
    gap: 12,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    paddingHorizontal: 4,
  },
  stat: {
    fontSize: 11,
  },
});
