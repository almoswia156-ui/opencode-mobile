import React, { useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface CodeEditorProps {
  value: string;
  onChange: (text: string) => void;
  language?: string;
  placeholder?: string;
  minHeight?: number;
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  placeholder = "// Start coding...",
  minHeight = 300,
}: CodeEditorProps) {
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.codeBackground,
          borderColor: colors.border,
          minHeight,
        },
      ]}
    >
      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: "#ff5f56" }]} />
          <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
          <View style={[styles.dot, { backgroundColor: "#27c93f" }]} />
        </View>
        <Text style={[styles.langLabel, { color: colors.codeComment }]}>
          {language}
        </Text>
      </View>
      <ScrollView horizontal={false} keyboardShouldPersistTaps="handled">
        <TextInput
          ref={inputRef}
          style={[
            styles.editor,
            {
              color: colors.codeForeground,
              fontFamily: Platform.select({
                ios: "Menlo",
                android: "monospace",
                web: "'Fira Code', 'Courier New', monospace",
              }),
            },
          ]}
          value={value}
          onChangeText={onChange}
          multiline
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          placeholderTextColor={colors.codeComment}
          textAlignVertical="top"
          scrollEnabled={false}
          keyboardType="default"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  langLabel: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      web: "monospace",
    }),
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  editor: {
    fontSize: 13,
    lineHeight: 20,
    padding: 14,
    minHeight: 260,
  },
});
