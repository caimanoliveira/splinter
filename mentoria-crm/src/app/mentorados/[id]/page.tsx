"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Plus, UserPlus } from "lucide-react"
import Link from "next/link"

interface Mentorado {
  id: string; name: string; email: string; product_name: string
  status: string; start_date: string | null; end_date: string | null; notes: string | null
}
interface Sessao {
  id: string; date: string; duration_min: number
  summary: string | null; decisions: string | null; next_steps: string | null
}
interface Tarefa {
  id: string; title: string; description: string | null
  due_date: string | null; status: string; completed_at: string | null
}
interface Material {
  id: string; title: string; type: string; url: string; description: string | null
}
interface MentoradoMaterial {
  id: string; unlocked_at: string; seen_at: string | null; material: Material
}
interface AvaliacaoWithComp {
  id: string; score: number; notes: string | null; assessed_at: string
  competencia: { name: string } | null
}
interface Marco {
  id: string; title: string; description: string | null
  order: number; is_achieved: boolean; achieved_at: string | null
}
interface EtapaRespostaRef { etapa_slug: string; status: string }
interface MentoradoTrilha {
  id: string; trilha_slug: string; assigned_at: string
  started_at: string | null; completed_at: string | null
  etapa_respostas?: EtapaRespostaRef[]
}

const TRILHAS_DISPONIVEIS: Array<{ slug: string; titulo: string }> = [
  { slug: "preparacao-entrevistas", titulo: "Preparação para Entrevistas" },
  { slug: "mapa-competencias", titulo: "Mapa de Competências" },
]

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  paused: "bg-yellow-100 text-yellow-700",
}

const statusLabels: Record<string, string> = {
  active: "Ativo", completed: "Concluído", paused: "Pausado",
}

const tarefaColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
}

const tarefaLabels: Record<string, string> = {
  pending: "Pendente", in_progress: "Em andamento", done: "Concluída",
}

export default function MentoradoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [mentorado, setMentorado] = useState<Mentorado | null>(null)
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [materiais, setMateriais] = useState<MentoradoMaterial[]>([])
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoWithComp[]>([])
  const [marcos, setMarcos] = useState<Marco[]>([])
  const [trilhas, setTrilhas] = useState<MentoradoTrilha[]>([])
  const [trilhaSlug, setTrilhaSlug] = useState<string>("")
  const [atribuindoTrilha, setAtribuindoTrilha] = useState(false)
  const [trilhaError, setTrilhaError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"sessoes" | "tarefas" | "materiais" | "avaliacoes" | "marcos" | "trilhas">("sessoes")
  const [novoMarco, setNovoMarco] = useState({ title: "", description: "" })
  const [savingMarco, setSavingMarco] = useState(false)
  const [criandoAcesso, setCriandoAcesso] = useState(false)
  const [acessoStatus, setAcessoStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [acessoError, setAcessoError] = useState<string | null>(null)
  const [concluindo, setConcluindo] = useState(false)
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const [m, s, t, mt, av, mk, tr] = await Promise.all([
        supabase.from("mentorados").select("*").eq("id", id).single(),
        supabase.from("sessoes").select("*").eq("mentorado_id", id).order("date", { ascending: false }),
        supabase.from("tarefas").select("*").eq("mentorado_id", id).order("created_at", { ascending: false }),
        supabase.from("mentorado_materiais").select("*, material:materiais(*)").eq("mentorado_id", id).order("unlocked_at", { ascending: false }),
        supabase.from("avaliacoes_competencia").select("*, competencia:competencias(name)").eq("mentorado_id", id).order("assessed_at", { ascending: false }).limit(20),
        supabase.from("marcos").select("*").eq("mentorado_id", id).order("order", { ascending: true }),
        supabase.from("mentorado_trilhas").select("id, trilha_slug, assigned_at, started_at, completed_at, etapa_respostas(etapa_slug, status)").eq("mentorado_id", id).order("assigned_at", { ascending: false }),
      ])
      setMentorado(m.data)
      setSessoes(s.data ?? [])
      setTarefas(t.data ?? [])
      setMateriais(mt.data ?? [])
      setAvaliacoes(av.data ?? [])
      setMarcos(mk.data ?? [])
      setTrilhas((tr.data ?? []) as MentoradoTrilha[])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleCriarAcesso() {
    if (!mentorado) return
    setCriandoAcesso(true)
    setAcessoStatus('idle')
    setAcessoError(null)

    const res = await fetch('/api/criar-acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: mentorado.email,
        mentorado_id: mentorado.id,
        name: mentorado.name,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setAcessoStatus('error')
      setAcessoError(data.error || 'Erro ao criar acesso')
    } else {
      setAcessoStatus('success')
    }
    setCriandoAcesso(false)
  }

  async function handleConcluir() {
    if (!mentorado) return
    setConcluindo(true)
    const res = await fetch('/api/concluir-mentoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorado_id: mentorado.id, email: mentorado.email, name: mentorado.name }),
    })
    if (res.ok) {
      setConcluido(true)
      setMentorado(prev => prev ? { ...prev, status: 'completed' } : null)
    }
    setConcluindo(false)
  }

  async function handleAddMarco() {
    if (!novoMarco.title.trim() || !id) return
    setSavingMarco(true)
    const nextOrder = (marcos[marcos.length - 1]?.order ?? 0) + 1
    const { data } = await supabase.from("marcos").insert({
      mentorado_id: id,
      title: novoMarco.title.trim(),
      description: novoMarco.description.trim() || null,
      order: nextOrder,
      is_achieved: false,
    }).select().single()
    if (data) setMarcos(prev => [...prev, data as Marco])
    setNovoMarco({ title: "", description: "" })
    setSavingMarco(false)
  }

  async function handleToggleMarco(marco: Marco) {
    const achieved = !marco.is_achieved
    await supabase.from("marcos").update({
      is_achieved: achieved,
      achieved_at: achieved ? new Date().toISOString() : null,
    }).eq("id", marco.id)
    setMarcos(prev => prev.map(m => m.id === marco.id ? { ...m, is_achieved: achieved, achieved_at: achieved ? new Date().toISOString() : null } : m))
  }

  async function handleDeleteMarco(marcoId: string) {
    await supabase.from("marcos").delete().eq("id", marcoId)
    setMarcos(prev => prev.filter(m => m.id !== marcoId))
  }

  async function handleAtribuirTrilha() {
    if (!id || !trilhaSlug) return
    setAtribuindoTrilha(true)
    setTrilhaError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from("mentorado_trilhas").insert({
      mentorado_id: id,
      trilha_slug: trilhaSlug,
      assigned_by: user?.id ?? null,
    }).select("id, trilha_slug, assigned_at, started_at, completed_at").single()
    if (error) {
      setTrilhaError(error.code === "23505" ? "Trilha já atribuída." : error.message)
    } else if (data) {
      setTrilhas(prev => [{ ...(data as MentoradoTrilha), etapa_respostas: [] }, ...prev])
      setTrilhaSlug("")
    }
    setAtribuindoTrilha(false)
  }

  async function handleRemoverTrilha(mt: MentoradoTrilha) {
    setTrilhaError(null)
    if (mt.started_at) {
      setTrilhaError("Trilha já iniciada — não pode ser removida.")
      return
    }
    const { error } = await supabase.from("mentorado_trilhas").delete().eq("id", mt.id)
    if (error) {
      setTrilhaError(error.message)
      return
    }
    setTrilhas(prev => prev.filter(x => x.id !== mt.id))
  }

  if (loading) return <div className="text-center py-20 text-slate-400">Carregando…</div>
  if (!mentorado) return <div className="text-center py-20 text-slate-400">Mentorado não encontrado.</div>

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mentorados" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-indigo-700">{mentorado.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{mentorado.name}</h1>
            <p className="text-sm text-slate-500">{mentorado.email} · {mentorado.product_name}</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[mentorado.status]}`}>
            {statusLabels[mentorado.status]}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Link
          href={`/mentorados/${id}/nova-sessao`}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova Sessão
        </Link>
        <Link
          href={`/mentorados/${id}/nova-tarefa`}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Link>
        {mentorado.status !== 'completed' && (
          <button
            onClick={handleConcluir}
            disabled={concluindo || concluido}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {concluindo ? 'Concluindo…' : concluido ? '✓ Concluída' : 'Concluir mentoria'}
          </button>
        )}
        <button
          onClick={handleCriarAcesso}
          disabled={criandoAcesso || acessoStatus === 'success'}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {criandoAcesso ? (
            'Criando…'
          ) : acessoStatus === 'success' ? (
            '✓ Acesso criado'
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Criar acesso no portal
            </>
          )}
        </button>
      </div>
      {acessoStatus === 'success' && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4">
          <span>✓</span>
          <span>Email de boas-vindas enviado para <strong>{mentorado?.email}</strong>. O mentorado receberá um link para definir sua senha.</span>
        </div>
      )}
      {acessoStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <span>⚠</span>
          <span>{acessoError}</span>
        </div>
      )}

      {/* Notes */}
      {mentorado.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <strong>Notas internas: </strong>{mentorado.notes}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-1">
        {(["sessoes", "tarefas", "materiais", "avaliacoes", "marcos", "trilhas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "sessoes" ? "Sessões" : tab === "tarefas" ? "Tarefas" : tab === "materiais" ? "Materiais" : tab === "avaliacoes" ? "Avaliações" : tab === "marcos" ? "Marcos" : "Trilhas"}
            <span className="ml-1.5 text-xs text-slate-400">
              ({tab === "sessoes" ? sessoes.length : tab === "tarefas" ? tarefas.length : tab === "materiais" ? materiais.length : tab === "avaliacoes" ? avaliacoes.length : tab === "marcos" ? marcos.length : trilhas.length})
            </span>
          </button>
        ))}
      </div>

      {/* Sessões */}
      {activeTab === "sessoes" && (
        <div className="flex flex-col gap-4">
          {sessoes.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nenhuma sessão registrada.</p>
          ) : sessoes.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-900">
                  {new Date(s.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
                <span className="text-xs text-slate-400">{s.duration_min} min</span>
              </div>
              {s.summary && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Resumo</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.summary}</p>
                </div>
              )}
              {s.decisions && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Decisões</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.decisions}</p>
                </div>
              )}
              {s.next_steps && (
                <div>
                  <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Próximos passos</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.next_steps}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tarefas */}
      {activeTab === "tarefas" && (
        <div className="flex flex-col gap-3">
          {tarefas.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nenhuma tarefa atribuída.</p>
          ) : tarefas.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${tarefaColors[t.status]}`}>
                {tarefaLabels[t.status]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{t.title}</p>
                {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                {t.due_date && (
                  <p className="text-xs text-slate-400 mt-1">
                    Prazo: {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Materiais */}
      {activeTab === "materiais" && (
        <div className="flex flex-col gap-3">
          {materiais.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nenhum material atribuído.</p>
          ) : materiais.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{m.material.title}</p>
                {m.material.description && <p className="text-xs text-slate-500 mt-0.5">{m.material.description}</p>}
                <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wide">{m.material.type}</p>
              </div>
              <div className="text-xs text-slate-400 shrink-0 text-right">
                {m.seen_at ? (
                  <span className="text-emerald-600 font-medium">Visto</span>
                ) : (
                  <span>Não visto</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Avaliações */}
      {activeTab === "avaliacoes" && (
        <div className="flex flex-col gap-3">
          {avaliacoes.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nenhuma avaliação registrada.</p>
          ) : avaliacoes.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{a.competencia?.name ?? "—"}</p>
                {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(a.assessed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ backgroundColor: `hsl(${(a.score / 10) * 120}, 60%, 50%)` }}>
                  {a.score}
                </div>
                <span className="text-xs text-slate-400">/10</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Marcos */}
      {activeTab === "marcos" && (
        <div className="flex flex-col gap-4">
          {/* Add marco form */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Adicionar marco</p>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Título do marco"
                value={novoMarco.title}
                onChange={e => setNovoMarco(prev => ({ ...prev, title: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={novoMarco.description}
                onChange={e => setNovoMarco(prev => ({ ...prev, description: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddMarco}
                disabled={savingMarco || !novoMarco.title.trim()}
                className="self-start flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> {savingMarco ? "Salvando…" : "Adicionar"}
              </button>
            </div>
          </div>

          {/* Marcos list */}
          {marcos.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">Nenhum marco definido. Crie o primeiro acima.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {marcos.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                  <button
                    onClick={() => handleToggleMarco(m)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${
                      m.is_achieved ? "bg-indigo-600 border-indigo-600" : "border-slate-300 hover:border-indigo-400"
                    }`}
                    aria-label={m.is_achieved ? "Marcar como não atingido" : "Marcar como atingido"}
                  >
                    {m.is_achieved && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${m.is_achieved ? "text-slate-400 line-through" : "text-slate-900"}`}>{m.title}</p>
                    {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                    {m.achieved_at && (
                      <p className="text-xs text-indigo-500 mt-0.5">
                        Atingido em {new Date(m.achieved_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMarco(m.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                    aria-label="Remover marco"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trilhas */}
      {activeTab === "trilhas" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Atribuir trilha</p>
            <div className="flex gap-2">
              <select
                value={trilhaSlug}
                onChange={e => setTrilhaSlug(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione uma trilha</option>
                {TRILHAS_DISPONIVEIS.filter(t => !trilhas.some(mt => mt.trilha_slug === t.slug)).map(t => (
                  <option key={t.slug} value={t.slug}>{t.titulo}</option>
                ))}
              </select>
              <button
                onClick={handleAtribuirTrilha}
                disabled={atribuindoTrilha || !trilhaSlug}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> {atribuindoTrilha ? "Atribuindo…" : "Atribuir"}
              </button>
            </div>
            {trilhaError && (
              <p className="text-xs text-red-600 mt-2">{trilhaError}</p>
            )}
          </div>

          {trilhas.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">Nenhuma trilha atribuída.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {trilhas.map(mt => {
                const titulo = TRILHAS_DISPONIVEIS.find(t => t.slug === mt.trilha_slug)?.titulo ?? mt.trilha_slug
                const respostas = mt.etapa_respostas ?? []
                const done = respostas.filter(e => e.status === "done").length
                const iniciada = !!mt.started_at
                const concluida = !!mt.completed_at
                return (
                  <div key={mt.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {concluida
                          ? `Concluída em ${new Date(mt.completed_at!).toLocaleDateString("pt-BR")}`
                          : iniciada
                          ? `Em andamento · ${done} etapa(s) concluída(s)`
                          : "Não iniciada"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Atribuída em {new Date(mt.assigned_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {!iniciada && !concluida && (
                      <button
                        onClick={() => handleRemoverTrilha(mt)}
                        className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                        aria-label="Remover trilha"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
