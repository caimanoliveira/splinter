"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";

type Item = {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  precoAtacado: number;
  precoBairro: number;
};

const CESTA_PADRAO: Item[] = [
  { id: "1", nome: "Arroz", quantidade: 1, unidade: "pacote 5kg", precoAtacado: 24.9, precoBairro: 32.9 },
  { id: "2", nome: "Feijão carioca", quantidade: 2, unidade: "pacote 1kg", precoAtacado: 7.5, precoBairro: 10.9 },
  { id: "3", nome: "Óleo de soja", quantidade: 2, unidade: "garrafa 900ml", precoAtacado: 5.9, precoBairro: 8.9 },
  { id: "4", nome: "Açúcar refinado", quantidade: 1, unidade: "pacote 1kg", precoAtacado: 3.9, precoBairro: 5.8 },
  { id: "5", nome: "Café torrado", quantidade: 1, unidade: "pacote 500g", precoAtacado: 17.9, precoBairro: 24.9 },
  { id: "6", nome: "Macarrão espaguete", quantidade: 3, unidade: "pacote 500g", precoAtacado: 3.8, precoBairro: 5.9 },
  { id: "7", nome: "Sal refinado", quantidade: 1, unidade: "pacote 1kg", precoAtacado: 1.9, precoBairro: 3.5 },
  { id: "8", nome: "Farinha de trigo", quantidade: 1, unidade: "pacote 1kg", precoAtacado: 4.5, precoBairro: 6.9 },
  { id: "9", nome: "Leite integral", quantidade: 6, unidade: "caixa 1L", precoAtacado: 4.2, precoBairro: 5.9 },
  { id: "10", nome: "Manteiga com sal", quantidade: 1, unidade: "pote 200g", precoAtacado: 8.9, precoBairro: 13.9 },
  { id: "11", nome: "Ovos", quantidade: 1, unidade: "cartela 30un", precoAtacado: 18.9, precoBairro: 25.9 },
  { id: "12", nome: "Papel higiênico", quantidade: 1, unidade: "pacote 12 rolos", precoAtacado: 19.9, precoBairro: 29.9 },
];

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ComparadorPage() {
  const [itens, setItens] = useState<Item[]>(CESTA_PADRAO);

  const totais = useMemo(() => {
    const atacado = itens.reduce((s, i) => s + i.quantidade * i.precoAtacado, 0);
    const bairro = itens.reduce((s, i) => s + i.quantidade * i.precoBairro, 0);
    const economia = bairro - atacado;
    const pct = bairro > 0 ? (economia / bairro) * 100 : 0;
    return { atacado, bairro, economia, pct };
  }, [itens]);

  function atualizar<K extends keyof Item>(id: string, campo: K, valor: Item[K]) {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)));
  }

  function remover(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  function adicionar() {
    setItens((prev) => [
      ...prev,
      {
        id: novoId(),
        nome: "",
        quantidade: 1,
        unidade: "un",
        precoAtacado: 0,
        precoBairro: 0,
      },
    ]);
  }

  function restaurar() {
    setItens(CESTA_PADRAO);
  }

  return (
    <main className="min-h-screen bg-[var(--gray-bg)] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--navy)]">
            Atacado vs. Mercado de Bairro
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Monte sua lista de compras e veja na hora quanto você economiza indo
            ao atacado em vez do mercado do bairro. Já começamos com uma cesta
            básica de referência — edite os preços conforme sua região.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card
            label="Total no Atacado"
            value={BRL(totais.atacado)}
            tone="green"
          />
          <Card
            label="Total no Mercado de Bairro"
            value={BRL(totais.bairro)}
            tone="navy"
          />
          <Card
            label="Economia indo ao Atacado"
            value={`${BRL(totais.economia)} (${totais.pct.toFixed(1)}%)`}
            tone="coral"
          />
        </section>

        <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[var(--text-muted)]">
                <tr className="text-left">
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium w-20">Qtd.</th>
                  <th className="px-3 py-3 font-medium w-36">Unidade</th>
                  <th className="px-3 py-3 font-medium w-32">Atacado (R$)</th>
                  <th className="px-3 py-3 font-medium w-32">Bairro (R$)</th>
                  <th className="px-3 py-3 font-medium w-32 text-right">Subtotal B. − A.</th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const subAt = item.quantidade * item.precoAtacado;
                  const subBa = item.quantidade * item.precoBairro;
                  const diff = subBa - subAt;
                  return (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">
                        <input
                          value={item.nome}
                          onChange={(e) => atualizar(item.id, "nome", e.target.value)}
                          placeholder="Nome do item"
                          className="w-full bg-transparent outline-none focus:ring-2 focus:ring-[var(--blue-bright)] rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={item.quantidade}
                          onChange={(e) =>
                            atualizar(item.id, "quantidade", Number(e.target.value) || 0)
                          }
                          className="w-full bg-transparent outline-none focus:ring-2 focus:ring-[var(--blue-bright)] rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={item.unidade}
                          onChange={(e) => atualizar(item.id, "unidade", e.target.value)}
                          className="w-full bg-transparent outline-none focus:ring-2 focus:ring-[var(--blue-bright)] rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precoAtacado}
                          onChange={(e) =>
                            atualizar(item.id, "precoAtacado", Number(e.target.value) || 0)
                          }
                          className="w-full bg-transparent outline-none focus:ring-2 focus:ring-[var(--blue-bright)] rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precoBairro}
                          onChange={(e) =>
                            atualizar(item.id, "precoBairro", Number(e.target.value) || 0)
                          }
                          className="w-full bg-transparent outline-none focus:ring-2 focus:ring-[var(--blue-bright)] rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span
                          className={
                            diff > 0
                              ? "text-[var(--green-wa-hover)] font-medium"
                              : "text-[var(--text-muted)]"
                          }
                        >
                          {BRL(diff)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => remover(item.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                          aria-label="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {itens.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-[var(--text-muted)]">
                      Sua lista está vazia. Adicione itens ou restaure a cesta padrão.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 p-4 border-t border-[var(--border)] bg-slate-50">
            <button
              onClick={adicionar}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--blue-bright)] hover:bg-[var(--blue-dark)] text-white font-medium transition"
            >
              <Plus size={16} /> Adicionar item
            </button>
            <button
              onClick={restaurar}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[var(--border)] hover:bg-slate-100 text-[var(--navy)] font-medium transition"
            >
              <RotateCcw size={16} /> Restaurar cesta básica
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-6 text-center">
          Preços iniciais são apenas referências. Ajuste conforme o atacado e o
          mercado de bairro da sua região.
        </p>
      </div>
    </main>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "navy" | "coral";
}) {
  const bg =
    tone === "green"
      ? "bg-emerald-50 border-emerald-200"
      : tone === "coral"
      ? "bg-orange-50 border-orange-200"
      : "bg-white border-[var(--border)]";
  const text =
    tone === "green"
      ? "text-emerald-700"
      : tone === "coral"
      ? "text-orange-700"
      : "text-[var(--navy)]";
  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${text}`}>{value}</div>
    </div>
  );
}
