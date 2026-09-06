// src/services/ocrApi.js
import { getApiBaseUrl, getAuthToken } from "./api";

export async function scanReceipt(file) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing backend API URL.");
  }

  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${baseUrl}/ocr/scan-receipt`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to scan receipt");
  }

  return data.data;
}
