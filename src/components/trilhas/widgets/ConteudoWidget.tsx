'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { completeEtapa } from '@/lib/trilhas/actions';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

export default function ConteudoWidget({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const [pending, start] = useTransition();
  const done = resposta?.status === 'done';
  const [error, setError] = useState<string | null>(null);

  const markdown = (etapa.config as { markdown: string }).markdown;

  function marcar() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { lido_em: new Date().toISOString() },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <MarkdownMinimal content={markdown} />
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Lido
          </div>
        ) : (
          <button
            onClick={marcar}
            disabled={pending}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Marcar como lido'}
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

function MarkdownMinimal({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flush = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul
          key={elements.length}
          className="list-disc ml-5 mb-3 text-[#64748b] text-sm leading-relaxed"
        >
          {bulletBuffer.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith('### ')) {
      flush();
      elements.push(
        <h3
          key={elements.length}
          className="font-semibold text-sm text-[#0f172a] mt-4 mb-2"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flush();
      elements.push(
        <h2
          key={elements.length}
          className="font-bold text-base text-[#0f172a] mt-5 mb-2"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      flush();
      elements.push(
        <h1
          key={elements.length}
          className="font-extrabold text-lg text-[#0f172a] mt-6 mb-3"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('- ')) {
      bulletBuffer.push(line.slice(2));
      continue;
    }
    flush();
    elements.push(
      <p
        key={elements.length}
        className="text-[#64748b] text-sm leading-relaxed mb-3"
      >
        {renderInline(line)}
      </p>
    );
  }
  flush();
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let idx = 0;
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > idx) parts.push(text.slice(idx, match.index));
    const token = match[0];
    if (token.startsWith('**')) parts.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    else parts.push(<em key={i++}>{token.slice(1, -1)}</em>);
    idx = match.index + token.length;
  }
  if (idx < text.length) parts.push(text.slice(idx));
  return parts;
}
