const STORAGE_KEY = "ltw-2026-intro-responses";

export async function saveIntroResponse(payload) {
  const response = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...payload,
  };

  try {
    const res = await fetch("/api/intro", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.response) return data.response;
    }
  } catch (error) {
    console.log("[v0] saveIntroResponse failed, falling back to localStorage:", error.message);
  }

  // Offline / failure fallback so the visitor still gets their card.
  const current = getLocalResponses();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([response, ...current]));
  return response;
}

export function getLocalResponses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
