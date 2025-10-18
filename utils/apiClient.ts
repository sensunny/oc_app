// src/utils/apiClient.ts

import { patientApi } from "@/services/api";

const BASE_URL = "https://www.oncarecancer.com/mobile-app";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: any;
  token?: string;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(
  endpoint: string,
  { method = "GET", body, token, headers = {} }: FetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { token } : {}),
    ...headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 🧠 Auto logout on 4xx
    if (response.status >= 400 && response.status < 500) {
      console.warn("Session expired or invalid. Logging out...");
    //   patientApi.logout(); // This should trigger your app logout logic
      throw new Error("Session expired or unauthorized.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
