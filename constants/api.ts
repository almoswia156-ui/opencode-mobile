import { Platform } from "react-native";

const DEV_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

export const API_BASE = DEV_DOMAIN
  ? `https://${DEV_DOMAIN}/api`
  : Platform.OS === "web"
    ? "/api"
    : "http://localhost:8080/api";

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  return response;
}
