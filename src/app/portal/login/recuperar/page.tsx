"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/portal/login/nova-senha",
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="grid grid-cols-3 gap-0.5 w-7 h-7 shrink-0">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`rounded-[2px] ${i === 4 ? "bg-[#1E88E5]" : "bg-white"}`} />
            ))}
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Caiman Oliveira</p>
            <p className="text-[#64748b] text-xs leading-tight">Portal do Mentorado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-xl">
          {success ? (
            <div>
              <h1 className="text-[#0f172a] font-extrabold text-xl mb-1">Verifique seu email</h1>
              <p className="text-[#64748b] text-sm mb-6">
                Enviamos um link de recuperação para <strong>{email}</strong>. Clique no link do email para definir uma nova senha.
              </p>
              <p className="text-[#94a3b8] text-xs text-center leading-relaxed">
                Não recebeu?{" "}
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-[#1E88E5] hover:underline"
                >
                  Tentar novamente
                </button>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-[#0f172a] font-extrabold text-xl mb-1">Recuperar senha</h1>
              <p className="text-[#64748b] text-sm mb-6">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[#0f172a] text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent transition"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1E88E5] hover:bg-[#1565C0] disabled:opacity-60 text-white font-bold py-3 rounded-full transition-colors mt-1"
                >
                  {loading ? "Enviando…" : "Enviar link de recuperação"}
                </button>
              </form>
            </>
          )}

          <p className="text-[#94a3b8] text-xs text-center mt-5 leading-relaxed">
            <a href="/portal/login" className="text-[#1E88E5] hover:underline">
              Voltar ao login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
