import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiFetch } from "@/constants/api";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "opencode_editor_content";
const STORAGE_LANG_KEY = "opencode_editor_lang";

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  "Explain this code",
  "Find bugs",
  "Add comments",
  "Optimize for performance",
  "Convert to TypeScript",
  "Write unit tests",
];

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: "system",
      content:
        "AI Assistant ready. Your current editor content will be sent with each message for context.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        const [code, lang] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_LANG_KEY),
        ]);

        const res = await apiFetch("/analyze", {
          method: "POST",
          body: JSON.stringify({
            prompt: trimmed,
            files: [
              {
                name: `main.${lang ?? "js"}`,
                content: code ?? "",
                language: lang ?? "javascript",
              },
            ],
          }),
        });

        const data = (await res.json()) as {
          response?: string;
          error?: string;
          analysis?: string;
        };

        const assistantMsg: Message = {
          id: makeId(),
          role: "assistant",
          content:
            data.response ??
            data.analysis ??
            data.error ??
            "No response from server.",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        const errorMsg: Message = {
          id: makeId(),
          role: "assistant",
          content:
            "Could not reach the AI backend. Make sure the API server is running and your API_BASE is configured correctly.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }
    },
    [loading]
  );

  const handleClear = () => {
    setMessages([
      {
        id: makeId(),
        role: "system",
        content: "Conversation cleared. Ready for new questions.",
        timestamp: Date.now(),
      },
    ]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isSystem = item.role === "system";

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={[styles.systemMsgText, { color: colors.mutedForeground }]}>
            {item.content}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        {!isUser && (
          <View
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              AI
            </Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [
                  styles.assistantBubble,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              {
                color: isUser ? colors.primaryForeground : colors.foreground,
                fontFamily:
                  item.content.includes("```") ||
                  item.content.includes("    ")
                    ? Platform.select({
                        ios: "Menlo",
                        android: "monospace",
                        web: "monospace",
                      })
                    : undefined,
              },
            ]}
          >
            {item.content}
          </Text>
          <Text style={[styles.timestamp, { color: isUser ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {isUser && (
          <View
            style={[styles.avatar, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.avatarText, { color: colors.foreground }]}>You</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "web" ? 67 : 80}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? insets.top + 67 : 0,
          },
        ]}
      >
        <View style={styles.headerInfo}>
          <View
            style={[styles.statusDot, { backgroundColor: colors.primary }]}
          />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI Code Assistant
          </Text>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.mutedForeground }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messages}
        contentContainerStyle={[
          styles.messagesContent,
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

      <View style={[styles.quickPromptsContainer, { borderTopColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          {QUICK_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => sendMessage(p)}
              disabled={loading}
              style={[
                styles.quickPrompt,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  opacity: loading ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={[styles.quickPromptText, { color: colors.foreground }]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
          placeholder="Ask about your code..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={1000}
          editable={!loading}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                loading || !input.trim() ? colors.muted : colors.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Text
              style={[styles.sendBtnText, { color: colors.primaryForeground }]}
            >
              ↑
            </Text>
          )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    fontSize: 13,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  systemMsg: {
    alignItems: "center",
    paddingVertical: 4,
  },
  systemMsgText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 9,
    fontWeight: "700",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    textAlign: "right",
  },
  quickPromptsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickPrompt: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
