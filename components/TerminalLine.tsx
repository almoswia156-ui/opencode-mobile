import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export type LineType = "input" | "output" | "error" | "info";

export interface TerminalLineData {
  id: string;
  type: LineType;
  content: string;
  timestamp?: number;
}

interface TerminalLineProps {
  line: TerminalLineData;
}

export function TerminalLine({ line }: TerminalLineProps) {
  const colors = useColors();

  const textColor =
    line.type === "input"
      ? colors.terminalPrompt
      : line.type === "error"
        ? colors.terminalError
        : line.type === "info"
          ? colors.terminalMuted
          : colors.terminalText;

  const prefix =
    line.type === "input" ? "$ " : line.type === "info" ? "  " : "  ";

  return (
    <View style={styles.line}>
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontFamily: Platform.select({
              ios: "Menlo",
              android: "monospace",
              web: "'Fira Code', monospace",
            }),
          },
        ]}
      >
        {prefix}
        {line.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    paddingVertical: 1,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
  },
});
