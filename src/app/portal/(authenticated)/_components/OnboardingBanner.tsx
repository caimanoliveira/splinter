"use client";

import Link from "next/link";
import { useState } from "react";

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("onboarding_dismissed") === "1";
  });

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem("onboarding_dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-5 mb-6 text-white border border-[#1E88E5]/30 relative">
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="absolute top-4 right-4 text-[#94a3b8] hover:text-white transition-colors text-xl leading-none"
      >
        ×
      </button>

      <p className="font-extrabold text-base mb-1 pr-8">
        Bem-vindo ao seu portal de mentoria!
      </p>
      <p className="text-[#94a3b8] text-sm mb-4">
        Comece por estes 3 passos para aproveitar ao máximo sua mentoria.
      </p>

      <ol className="flex flex-col gap-3">
        <li className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#F97316]/20 text-[#F97316] text-xs font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <Link
            href="/portal/canvas"
            className="text-[#F97316] text-sm font-semibold hover:underline"
          >
            Criar seu Decision Canvas
          </Link>
        </li>
        <li className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#1E88E5]/20 text-[#1E88E5] text-xs font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <Link
            href="/portal/checkin"
            className="text-[#1E88E5] text-sm font-semibold hover:underline"
          >
            Fazer seu primeiro check-in
          </Link>
        </li>
        <li className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-slate-500/20 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
            3
          </span>
          <Link
            href="/portal/materiais"
            className="text-slate-300 text-sm font-semibold hover:underline"
          >
            Explorar os materiais
          </Link>
        </li>
      </ol>
    </div>
  );
}
