import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import type { Todo } from "@/types/todo";
import { TodosDashboard } from "./TodosDashboard";

export const metadata: Metadata = {
  title: "Agents — Tasks",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  const initial: Todo[] = error || !data ? [] : (data as Todo[]);

  return <TodosDashboard initial={initial} loadError={error?.message ?? null} />;
}
