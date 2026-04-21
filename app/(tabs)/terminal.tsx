import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TerminalLine, TerminalLineData } from "@/components/TerminalLine";
import { apiFetch } from "@/constants/api";
import { useColors } from "@/hooks/useColors";

const HISTORY_LIMIT = 20;
const COMMON_CMDS = ["ls", "pwd", "echo Hello", "node --version", "npm --version", "date"];

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

export default function TerminalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [lines, setLines] = useState<TerminalLineData[]>([
    {
      id: makeId(),
      type: "info",
      content: "OpenCode Terminal — connected to backend",
    },
    {
      id: makeId(),
      type: "info",
      content: "Type a command below or tap a shortcut",
    },
    {
      id: makeId(),
      type: "info",
      content: "─────────────────────────────",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const addLine = useCallback((type: TerminalLineData["type"], content: string) => {
    setLines((prev) => [...prev, { id: makeId(), type, content }]);
  }, []);

  const runCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      addLine("input", trimmed);
      setHistory((h) => [trimmed, ...h].slice(0, HISTORY_LIMIT));
      setHistoryIdx(-1);
      setInput("");
      setLoading(true);

      try {
        const res = await apiFetch("/terminal", {
          method: "POST",
          body: JSON.stringify({ command: trimmed }),
        });
        const data = (await res.json()) as {
          output?: string;
          error?: string;
          blocked?: boolean;
        };

        if (data.blocked) {
          addLine("error", "Command blocked: not allowed for safety reasons");
        } else if (data.error) {
          addLine("error", data.error);
        } else if (data.output) {
          const outputLines = data.output.split("\n");
          for (const line of outputLines) {
            if (line) addLine("output", line);
          }
        }
      } catch {
        addLine("error", "Could not reach backend. Check API connection.");
      } finally {
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [addLine]
  );

  const handleClear = () => {
    setLines([
      {
        id: makeId(),
        type: "info",
        content: "Terminal cleared",
      },
    ]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleHistoryUp = () => {
    if (history.length === 0) return;
    const next = Math.min(historyIdx + 1, history.length - 1);
    setHistoryIdx(next);
    setInput(history[next] ?? "");
  };

  const handleHistoryDown = () => {
    if (historyIdx <= 0) {
      setHistoryIdx(-1);
      setInput("");
      return;
    }
    const next = historyIdx - 1;
    setHistoryIdx(next);
    setInput(history[next] ?? "");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.terminal }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "web" ? 67 : 80}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: "#111111",
            borderBottomColor: "#222222",
            paddingTop: Platform.OS === "web" ? insets.top + 67 : 0,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: "#ff5f56" }]} />
          <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
          <View style={[styles.dot, { backgroundColor: "#27c93f" }]} />
        </View>
        <Text style={styles.headerTitle}>bash — OpenCode Terminal</Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={lines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TerminalLine line={item} />}
        style={styles.output}
        contentContainerStyle={[
          styles.outputContent,
          {
            paddingBottom:
              Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 20,
          },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled
      />

      <View style={[styles.shortcuts, { borderTopColor: "#222222" }]}>
        <FlatList
          horizontal
          data={COMMON_CMDS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setInput(item);
                inputRef.current?.focus();
                Haptics.selectionAsync();
              }}
              style={styles.shortcut}
            >
              <Text style={styles.shortcutText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: "#111111",
            borderTopColor: "#222222",
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        <Text style={[styles.prompt, { color: colors.terminalPrompt }]}>$</Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.terminalText }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => runCommand(input)}
          returnKeyType="send"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Enter command..."
          placeholderTextColor="#444444"
          editable={!loading}
          blurOnSubmit={false}
          fontFamily={Platform.select({
            ios: "Menlo",
            android: "monospace",
            web: "monospace",
          })}
        />
        <View style={styles.navBtns}>
          <TouchableOpacity onPress={handleHistoryUp} style={styles.navBtn}>
            <Text style={styles.navBtnText}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHistoryDown} style={styles.navBtn}>
            <Text style={styles.navBtnText}>↓</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => runCommand(input)}
          disabled={loading || !input.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                loading || !input.trim() ? "#333333" : colors.terminalPrompt,
            },
          ]}
        >
          <Text style={styles.sendBtnText}>{loading ? "..." : "▶"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#666666",
    fontSize: 11,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", web: "monospace" }),
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: "#555555",
    fontSize: 12,
  },
  output: {
    flex: 1,
  },
  outputContent: {
    padding: 14,
  },
  shortcuts: {
    borderTopWidth: 1,
    backgroundColor: "#111111",
  },
  shortcut: {
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#333333",
  },
  shortcutText: {
    color: "#00d4aa",
    fontSize: 11,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", web: "monospace" }),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  prompt: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", web: "monospace" }),
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", web: "monospace" }),
  },
  navBtns: {
    flexDirection: "row",
    gap: 4,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333333",
  },
  navBtnText: {
    color: "#666666",
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
});
