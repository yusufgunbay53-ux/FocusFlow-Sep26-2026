"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CloudRain,
  Headphones,
  Pause,
  Play,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  Volume2,
  VolumeX,
  GripVertical,
  Pencil,
} from "lucide-react";
import type { AppState, ColumnId, Priority, Task } from "@/lib/types";
import { addSession, defaultState, loadState, saveState, upsertTask } from "@/lib/storage";
import { coachAdvice, fetchCoachFromApi, type CoachMessage } from "@/lib/ai-coach";

const COLS: { id: ColumnId; label: string }[] = [
  { id: "todo", label: "Yapılacaklar" },
  { id: "doing", label: "Yapılıyor" },
  { id: "done", label: "Tamamlandı" },
];

const PRIO: Record<Priority, { label: string; className: string }> = {
  low: { label: "Düşük", className: "text-sky-300/80 border-sky-400/20 bg-sky-400/10" },
  medium: { label: "Orta", className: "text-cyan-200 border-cyan-300/30 bg-cyan-400/10" },
  high: { label: "Yüksek", className: "text-rose-200 border-rose-400/30 bg-rose-400/10" },
};

const WORK = 25 * 60;
const BRK = 5 * 60;

export default function FocusApp() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [editing, setEditing] = useState<Task | null>(null);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [left, setLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState<"off" | "rain" | "lofi">("off");
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(0.28);
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const audioRef = useRef<AmbientEngine | null>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const local = coachAdvice(state, running && mode === "work");
    setCoach(local);
    fetchCoachFromApi(state).then((remote) => {
      if (remote) setCoach(remote);
    });
  }, [state, running, mode, hydrated]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          onTimerEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new AmbientEngine();
    audioRef.current.setVolume(muted ? 0 : vol);
    audioRef.current.setMode(sound === "off" ? "off" : sound);
  }, [sound, muted, vol]);

  const onTimerEnd = useCallback(() => {
    setRunning(false);
    notify(mode === "work" ? "Pomodoro bitti — 5 dk mola" : "Mola bitti — odak zamanı");
    beep();
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        sessions: addSession(prev.stats.sessions, {
          id: crypto.randomUUID(),
          mode,
          startedAt: new Date(Date.now() - (mode === "work" ? WORK : BRK) * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          durationSec: mode === "work" ? WORK : BRK,
        }),
      },
    }));
    if (mode === "work") {
      setMode("break");
      setLeft(BRK);
    } else {
      setMode("work");
      setLeft(WORK);
    }
  }, [mode]);

  function addOrEdit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const now = new Date().toISOString();
    if (editing) {
      setState((s) => ({
        ...s,
        tasks: upsertTask(s.tasks, { ...editing, title: t, priority, updatedAt: now }),
      }));
      setEditing(null);
    } else {
      const task: Task = {
        id: crypto.randomUUID(),
        title: t,
        priority,
        column: "todo",
        createdAt: now,
        updatedAt: now,
      };
      setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    }
    setTitle("");
    setPriority("medium");
  }

  function move(id: string, column: ColumnId) {
    setState((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== id) return t;
        const now = new Date().toISOString();
        const completedAt = column === "done" ? now : undefined;
        return { ...t, column, updatedAt: now, completedAt };
      });
      const newlyDone = s.tasks.find((t) => t.id === id)?.column !== "done" && column === "done";
      return {
        ...s,
        tasks,
        stats: {
          ...s.stats,
          completedToday: s.stats.completedToday + (newlyDone ? 1 : 0),
        },
      };
    });
  }

  function remove(id: string) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const total = mode === "work" ? WORK : BRK;
  const pct = ((total - left) / total) * 100;

  const todayDone = useMemo(() => {
    const d = new Date().toISOString().slice(0, 10);
    return state.tasks.filter((t) => t.column === "done" && (t.completedAt || "").startsWith(d)).length;
  }, [state.tasks]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <header className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="fade-up">
          <p className="text-xs uppercase tracking-[0.28em] text-neon/70">FocusFlow</p>
          <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">AI Görev & Odak Asistanı</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-cyan-100/70">
          <Badge>Bugün {todayDone} tamamlandı</Badge>
          <Badge>{state.stats.sessions.filter((s) => s.mode === "work").length} pomodoro</Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <section className="glass fade-up rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2 text-neon">
              <Timer size={18} />
              <h2 className="text-sm font-medium tracking-wide">
                {mode === "work" ? "Odak" : "Mola"} · 25 / 5
              </h2>
            </div>
            <div className="relative mx-auto mb-5 flex h-44 w-44 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,210,255,0.12)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#00d2ff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${((100 - pct) / 100) * 2 * Math.PI * 44}`}
                />
              </svg>
              <span className="font-mono text-4xl text-white">
                {mm}:{ss}
              </span>
            </div>
            <div className="flex justify-center gap-2">
              <button
                className="glow-btn rounded-xl bg-neon/90 px-4 py-2 text-sm font-medium text-night"
                onClick={() => setRunning((r) => !r)}
              >
                {running ? (
                  <span className="flex items-center gap-1">
                    <Pause size={14} /> Duraklat
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Play size={14} /> Başlat
                  </span>
                )}
              </button>
              <button
                className="glow-btn rounded-xl border border-neon/20 px-3 py-2 text-sm text-cyan-100"
                onClick={() => {
                  setRunning(false);
                  setMode("work");
                  setLeft(WORK);
                }}
              >
                Sıfırla
              </button>
            </div>
          </section>

          <section className="glass fade-up rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon">
                <Headphones size={18} />
                <h2 className="text-sm font-medium">Ambient</h2>
              </div>
              <button onClick={() => setMuted((m) => !m)} className="text-cyan-200/70 hover:text-neon">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
            <div className="mb-3 flex gap-2">
              {(["off", "rain", "lofi"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setSound(k)}
                  className={`glow-btn flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                    sound === k ? "border-neon/50 bg-neon/15 text-neon" : "border-white/10 text-cyan-100/70"
                  }`}
                >
                  {k === "off" ? "Kapalı" : k === "rain" ? "Yağmur" : "Lo-Fi"}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              onChange={(e) => setVol(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="mt-2 flex items-center gap-1 text-[11px] text-cyan-100/40">
              <CloudRain size={12} /> Tarayıcıda üretilen ambient ses — harici dosya yok.
            </p>
          </section>

          <section className="glass fade-up rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2 text-neon">
              <Sparkles size={18} />
              <h2 className="text-sm font-medium">AI Performans Koçu</h2>
            </div>
            <p
              className={`text-sm leading-relaxed ${
                coach?.tone === "good"
                  ? "text-emerald-200"
                  : coach?.tone === "warn"
                  ? "text-amber-200"
                  : "text-cyan-100/80"
              }`}
            >
              {coach?.text ?? "Veriler yükleniyor…"}
            </p>
            <p className="mt-3 text-[11px] text-cyan-100/35">
              Mock kural motoru · NEXT_PUBLIC_AI_COACH_URL ile API’ye bağlanabilir.
            </p>
          </section>
        </aside>

        <section className="space-y-4">
          <form onSubmit={addOrEdit} className="glass fade-up flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={editing ? "Görevi düzenle…" : "Yeni görev ekle…"}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none ring-neon/40 placeholder:text-cyan-100/30 focus:ring-2"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-xl border border-white/10 bg-[#121a2b] px-3 py-2 text-sm"
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
            <button className="glow-btn inline-flex items-center justify-center gap-1 rounded-xl bg-neon px-4 py-2 text-sm font-medium text-night">
              {editing ? <Pencil size={14} /> : <Plus size={14} />}
              {editing ? "Kaydet" : "Ekle"}
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-3">
            {COLS.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId.current) move(dragId.current, col.id);
                  dragId.current = null;
                }}
                className="glass min-h-[280px] rounded-2xl p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-medium text-white">{col.label}</h3>
                  <span className="rounded-full bg-neon/10 px-2 py-0.5 text-[11px] text-neon">
                    {state.tasks.filter((t) => t.column === col.id).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {state.tasks
                    .filter((t) => t.column === col.id)
                    .map((t) => (
                      <article
                        key={t.id}
                        draggable
                        onDragStart={() => {
                          dragId.current = t.id;
                        }}
                        className="glow-btn group cursor-grab rounded-xl border border-white/8 bg-white/5 p-3 active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="mt-0.5 shrink-0 text-cyan-100/30" />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm ${t.column === "done" ? "text-cyan-100/50 line-through" : "text-white"}`}>
                              {t.title}
                            </p>
                            {t.notes && <p className="mt-1 text-xs text-cyan-100/40">{t.notes}</p>}
                            <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] ${PRIO[t.priority].className}`}>
                              {PRIO[t.priority].label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100">
                          {t.column !== "done" && (
                            <IconBtn title="Tamamla" onClick={() => move(t.id, "done")}>
                              <Check size={14} />
                            </IconBtn>
                          )}
                          <IconBtn
                            title="Düzenle"
                            onClick={() => {
                              setEditing(t);
                              setTitle(t.title);
                              setPriority(t.priority);
                            }}
                          >
                            <Pencil size={14} />
                          </IconBtn>
                          <IconBtn title="Sil" onClick={() => remove(t.id)}>
                            <Trash2 size={14} />
                          </IconBtn>
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="glass rounded-full px-3 py-1 text-xs">{children}</span>;
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button title={title} onClick={onClick} className="rounded-lg p-1.5 text-cyan-100/70 hover:bg-white/10 hover:text-neon">
      {children}
    </button>
  );
}

function notify(body: string) {
  if (typeof window === "undefined") return;
  if ("Notification" in window) {
    if (Notification.permission === "granted") new Notification("FocusFlow", { body });
    else if (Notification.permission !== "denied") Notification.requestPermission();
  }
}

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 660;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.22);
  } catch {
    /* ignore */
  }
}

class AmbientEngine {
  ctx: AudioContext | null = null;
  gain: GainNode | null = null;
  nodes: AudioNode[] = [];
  mode: "off" | "rain" | "lofi" = "off";

  ensure() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.28;
    this.gain.connect(this.ctx.destination);
  }

  setVolume(v: number) {
    this.ensure();
    if (this.gain) this.gain.gain.value = v;
  }

  stop() {
    this.nodes.forEach((n) => {
      try {
        (n as OscillatorNode).stop?.();
      } catch {
        /* */
      }
      n.disconnect?.();
    });
    this.nodes = [];
  }

  setMode(mode: "off" | "rain" | "lofi") {
    if (mode === this.mode && this.nodes.length) return;
    this.mode = mode;
    this.ensure();
    this.stop();
    if (!this.ctx || !this.gain || mode === "off") return;
    void this.ctx.resume();
    if (mode === "rain") this.startRain();
    else this.startLofi();
  }

  startRain() {
    if (!this.ctx || !this.gain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noise = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(this.gain);
    src.start();
    this.nodes.push(src, filter);
  }

  startLofi() {
    if (!this.ctx || !this.gain) return;
    const notes = [196, 246.94, 293.66, 329.63];
    notes.forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.value = 0.03;
      const lfo = this.ctx!.createOscillator();
      const lg = this.ctx!.createGain();
      lfo.frequency.value = 0.12 + i * 0.05;
      lg.gain.value = 8;
      lfo.connect(lg);
      lg.connect(o.frequency);
      o.connect(g);
      g.connect(this.gain!);
      o.start();
      lfo.start();
      this.nodes.push(o, g, lfo, lg);
    });
  }
}
