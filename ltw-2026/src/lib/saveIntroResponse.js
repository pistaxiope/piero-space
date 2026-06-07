const STORAGE_KEY = "ltw-2026-intro-responses";

export async function saveIntroResponse(payload) {
  const response = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...payload,
  };
  const current = getIntroResponses();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([response, ...current]));
  return response;
}

export function getIntroResponses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
