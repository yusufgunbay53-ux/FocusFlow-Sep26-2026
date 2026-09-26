import type { AppState } from "./types";

export interface CoachMessage {
  tone: "good" | "warn" | "info";
  text: string;
}

export function coachAdvice(state: AppState, isWorkRunning: boolean): CoachMessage {
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = state.tasks.filter(
    (t) => t.column === "done" && (t.completedAt || t.updatedAt).startsWith(today)
  ).length;
  const open = state.tasks.filter((t) => t.column !== "done").length;
  const workSessions = state.stats.sessions.filter(
    (s) => s.mode === "work" && s.endedAt.startsWith(today)
  ).length;
  const highOpen = state.tasks.filter((t) => t.column !== "done" && t.priority === "high").length;

  if (doneToday >= 4 && workSessions >= 2) {
    return { tone: "good", text: "Bugün harika gidiyorsun! Ritmini koru, kısa bir mola sonrası yüksek öncelikli işe dön." };
  }
  if (isWorkRunning && workSessions === 0) {
    return { tone: "info", text: "Odak bloğu başladı. Bildirimleri kapat, tek bir karta kilitlen." };
  }
  if (open > 6 && doneToday === 0) {
    return { tone: "warn", text: "Biraz yavaşladın. 5 dakika mola veya listedeki en küçük görevi bitirmek ister misin?" };
  }
  if (highOpen >= 2) {
    return { tone: "warn", text: `${highOpen} yüksek öncelikli iş açık. Kanban'da birini "Yapılıyor"a al ve tek seansa bağla.` };
  }
  if (doneToday > 0 && workSessions === 0) {
    return { tone: "info", text: "Görev kapatıyorsun, güzel. Bir Pomodoro ile ivmeyi ölçülebilir hale getir." };
  }
  return { tone: "info", text: "Küçük adımlar birikir. Bir kart seç, 25 dakika odaklan, sonra işaretle." };
}

/** API bağlantısına hazır iskelet */
export async function fetchCoachFromApi(payload: AppState): Promise<CoachMessage | null> {
  const url = process.env.NEXT_PUBLIC_AI_COACH_URL;
  if (!url) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks: payload.tasks, stats: payload.stats }),
  });
  if (!res.ok) return null;
  return res.json();
}
