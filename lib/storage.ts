import type { AppState, Task, PomodoroSession } from "./types";

const KEY = "focusflow:v1";

export const defaultState = (): AppState => ({
  tasks: [
    {
      id: "demo-1",
      title: "FocusFlow arayüzünü keşfet",
      notes: "Kanban kartlarını sürükle, öncelik etiketlerini dene.",
      priority: "medium",
      column: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo-2",
      title: "İlk Pomodoro seansını başlat",
      priority: "high",
      column: "doing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  stats: { sessions: [], completedToday: 0 },
});

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as AppState;
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function upsertTask(tasks: Task[], task: Task): Task[] {
  const i = tasks.findIndex((t) => t.id === task.id);
  if (i === -1) return [task, ...tasks];
  const next = [...tasks];
  next[i] = task;
  return next;
}

export function addSession(sessions: PomodoroSession[], s: PomodoroSession) {
  return [s, ...sessions].slice(0, 80);
}
