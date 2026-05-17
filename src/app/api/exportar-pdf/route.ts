import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", color: "#0f172a", fontSize: 10 },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 3 },
  subtitle: { fontSize: 10, color: "#64748b" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9, fontWeight: "bold", textTransform: "uppercase",
    color: "#1E88E5", letterSpacing: 1, marginBottom: 6,
    paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  label: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  text: { fontSize: 10, lineHeight: 1.5, color: "#334155" },
  field: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  pill: { fontSize: 9, color: "#475569" },
  score: { fontSize: 12, fontWeight: "bold", color: "#1E88E5" },
  check: { fontSize: 10, color: "#10b981" },
  circle: { fontSize: 10, color: "#94a3b8" },
  footer: { marginTop: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  footerText: { fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mentorado_id = searchParams.get("mentorado_id");
  if (!mentorado_id || !UUID_RE.test(mentorado_id)) {
    return NextResponse.json({ error: "mentorado_id inválido" }, { status: 400 });
  }

  // Auth check: validate user owns this mentorado_id
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { data: ownership } = await authClient
    .from("mentorados")
    .select("id")
    .eq("id", mentorado_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ownership) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [
    { data: mentorado },
    { data: canvases },
    { data: sessoes },
    { data: marcos },
    { data: avaliacoes },
  ] = await Promise.all([
    supabase.from("mentorados").select("name, product_name, start_date, end_date").eq("id", mentorado_id).single(),
    supabase.from("canvas").select("*").eq("mentorado_id", mentorado_id).eq("status", "active").limit(1),
    supabase.from("sessoes").select("*").eq("mentorado_id", mentorado_id).order("date", { ascending: false }).limit(5),
    supabase.from("marcos").select("*").eq("mentorado_id", mentorado_id).order("order"),
    supabase.from("avaliacoes_competencia").select("*, competencia:competencias(name)").eq("mentorado_id", mentorado_id).order("assessed_at", { ascending: false }).limit(40),
  ]);

  const canvas = canvases?.[0];

  // Latest score per competencia
  const latestAvaliacoes: Record<string, { name: string; score: number }> = {};
  for (const a of (avaliacoes ?? [])) {
    const name = (a.competencia as { name: string } | null)?.name ?? "—";
    if (!latestAvaliacoes[a.competencia_id]) {
      latestAvaliacoes[a.competencia_id] = { name, score: a.score };
    }
  }

  const canvasFields: [string, string | null][] = canvas ? [
    ["Contexto da decisão", canvas.context],
    ["Critérios explícitos", canvas.criteria],
    ["Restrições reais", canvas.constraints],
    ["Variáveis invisíveis", canvas.invisible_vars],
    ["Padrões de valor", canvas.value_patterns],
    ["Espaço de possibilidades", canvas.possibilities],
    ["Cenários e trade-offs", canvas.scenarios],
    ["Decisão Final", canvas.final_decision],
  ] : [];

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header
      createElement(View, { style: styles.header },
        createElement(Text, { style: styles.title }, mentorado?.name ?? "Mentorado"),
        createElement(Text, { style: styles.subtitle },
          `${mentorado?.product_name ?? "Mentoria"} · Relatório de Progresso`
        ),
      ),

      // Canvas
      canvas ? createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, `Decision Canvas — ${canvas.title}`),
        ...canvasFields
          .filter(([, v]) => !!v)
          .map(([label, value]) =>
            createElement(View, { key: label, style: styles.field },
              createElement(Text, { style: styles.label }, label),
              createElement(Text, { style: styles.text }, value ?? ""),
            )
          ),
      ) : null,

      // Competências
      Object.keys(latestAvaliacoes).length > 0 ? createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Avaliação de Competências"),
        ...Object.values(latestAvaliacoes).map(({ name, score }) =>
          createElement(View, { key: name, style: styles.row },
            createElement(Text, { style: styles.text }, name),
            createElement(Text, { style: styles.score }, `${score}/10`),
          )
        ),
      ) : null,

      // Marcos
      (marcos ?? []).length > 0 ? createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Marcos da Travessia"),
        ...(marcos ?? []).map((m) =>
          createElement(View, { key: m.id, style: styles.row },
            createElement(Text, { style: m.is_achieved ? styles.check : styles.circle },
              m.is_achieved ? "✓ " : "○ "
            ),
            createElement(Text, { style: [styles.text, { flex: 1 }] }, m.title),
          )
        ),
      ) : null,

      // Sessões
      (sessoes ?? []).length > 0 ? createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Sessões"),
        ...(sessoes ?? []).slice(0, 3).map((s) =>
          createElement(View, { key: s.id, style: styles.field },
            createElement(Text, { style: styles.label },
              new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
            ),
            s.summary ? createElement(Text, { style: styles.text }, s.summary) : null,
          )
        ),
      ) : null,

      // Footer
      createElement(View, { style: styles.footer },
        createElement(Text, { style: styles.footerText }, "Mentoria Carreira & Decisão"),
      ),
    )
  );

  const buffer = await renderToBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-mentoria.pdf"`,
    },
  });
}
