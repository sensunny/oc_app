import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://www.oncarecancer.com/mobile-app";
export const APP_VERSION = Constants.expoConfig?.version ?? "N/A";

export const DEVICE_DATA = {
  modelName: Device.modelName ?? "unknown",
  osVersion: Device.osVersion ?? "unknown",
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: any;
  token?: string;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

// Logout callback - set by AuthContext to avoid circular dependency
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function clearUnauthorizedHandler() {
  onUnauthorized = null;
}

function getDefaultHeaders(token?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    platform: Platform.OS,
    appversion: APP_VERSION,
    model: DEVICE_DATA.modelName,
    osVersion: DEVICE_DATA.osVersion,
    ...(token ? { token } : {}),
  };
}

export async function fetchWrapper<T = any>(
  endpoint: string,
  { method = "GET", body, token, headers = {}, skipAuth = false }: FetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  // Auto-attach token if not provided and not skipping auth
  let authToken = token;
  if (!authToken && !skipAuth) {
    authToken = (await AsyncStorage.getItem("access_token")) || undefined;
  }

  const finalHeaders: Record<string, string> = {
    ...getDefaultHeaders(authToken),
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 Unauthorized - trigger logout
  if (response.status === 401) {
    console.warn("401 Unauthorized - triggering logout");
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data as T;
}
