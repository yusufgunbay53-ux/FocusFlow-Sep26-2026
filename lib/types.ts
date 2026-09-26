export type Priority = "low" | "medium" | "high";
export type ColumnId = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: Priority;
  column: ColumnId;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PomodoroSession {
  id: string;
  mode: "work" | "break";
  startedAt: string;
  endedAt: string;
  durationSec: number;
}

export interface Stats {
  sessions: PomodoroSession[];
  completedToday: number;
}

export interface AppState {
  tasks: Task[];
  stats: Stats;
}
