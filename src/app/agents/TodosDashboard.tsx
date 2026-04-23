"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import type { Todo, TodoPriority, TodoStatus } from "@/types/todo";

type StatusPayload = RealtimePostgresChangesPayload<Todo>;

const STATUS_COLUMNS: { key: TodoStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const PRIORITY_ORDER: Record<TodoPriority, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };

export function TodosDashboard({
  initial,
  loadError,
}: {
  initial: Todo[];
  loadError: string | null;
}) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const applyChange = (payload: StatusPayload) => {
      setTodos((current) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const next = payload.new as Todo;
          if (current.some((t) => t.id === next.id)) return current;
          return [next, ...current];
        }
        if (payload.eventType === "UPDATE" && payload.new) {
          const next = payload.new as Todo;
          return current.map((t) => (t.id === next.id ? next : t));
        }
        if (payload.eventType === "DELETE" && payload.old) {
          const gone = payload.old as Todo;
          return current.filter((t) => t.id !== gone.id);
        }
        return current;
      });
    };

    const channel: RealtimeChannel = supabase
      .channel("todos-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        applyChange,
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const byStatus = useMemo(() => {
    const buckets: Record<TodoStatus, Todo[]> = {
      pending: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const t of todos) buckets[t.status]?.push(t);
    for (const key of Object.keys(buckets) as TodoStatus[]) {
      buckets[key].sort((a, b) => {
        const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (p !== 0) return p;
        return b.updated_at.localeCompare(a.updated_at);
      });
    }
    return buckets;
  }, [todos]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">
            Agents / Tasks
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Realtime via Supabase — updates stream in without reload.
          </p>
        </div>
        <ConnectionDot connected={connected} />
      </header>

      {loadError && (
        <div className="mx-6 mt-4 rounded border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-300">
          Failed to load initial todos: {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-6">
        {STATUS_COLUMNS.map((col) => (
          <Column
            key={col.key}
            label={col.label}
            count={byStatus[col.key].length}
            todos={byStatus[col.key]}
          />
        ))}
      </section>
    </div>
  );
}

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <span
        className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-neutral-700"}`}
        aria-hidden
      />
      <span>{connected ? "live" : "connecting…"}</span>
    </div>
  );
}

function Column({
  label,
  count,
  todos,
}: {
  label: string;
  count: number;
  todos: Todo[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-wide uppercase text-neutral-500">
          {label}
        </h2>
        <span className="text-xs text-neutral-600 tabular-nums">{count}</span>
      </div>
      <div className="flex flex-col gap-2">
        {todos.length === 0 ? (
          <div className="rounded border border-dashed border-neutral-900 px-3 py-6 text-center text-xs text-neutral-700">
            empty
          </div>
        ) : (
          todos.map((t) => <Card key={t.id} todo={t} />)
        )}
      </div>
    </div>
  );
}

function Card({ todo }: { todo: Todo }) {
  return (
    <article className="rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 hover:border-neutral-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-neutral-100 leading-snug">{todo.title}</p>
        <PriorityTag priority={todo.priority} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span className="truncate">
          {todo.assigned_agent ?? <span className="text-neutral-700">unassigned</span>}
        </span>
        <time dateTime={todo.updated_at} className="tabular-nums">
          {formatRelative(todo.updated_at)}
        </time>
      </div>
    </article>
  );
}

const PRIORITY_STYLES: Record<TodoPriority, string> = {
  p0: "border-red-800 text-red-300",
  p1: "border-amber-800 text-amber-300",
  p2: "border-neutral-700 text-neutral-400",
  p3: "border-neutral-800 text-neutral-600",
};

function PriorityTag({ priority }: { priority: TodoPriority }) {
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(then)) return "";
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
