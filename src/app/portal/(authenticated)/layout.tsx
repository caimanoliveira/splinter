import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Portal do Mentorado | Mentoria Carreira & Decisão",
  robots: { index: false, follow: false },
};

const navItems = [
  { href: "/portal/dashboard", label: "Início",    icon: "grid"    },
  { href: "/portal/canvas",    label: "Canvas",    icon: "canvas"  },
  { href: "/portal/checkin",   label: "Check-in",  icon: "pulse"   },
  { href: "/portal/tarefas",   label: "Tarefas",   icon: "check"   },
  { href: "/portal/materiais", label: "Materiais", icon: "book"    },
  { href: "/portal/perfil",    label: "Perfil",    icon: "user"    },
];

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "grid":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "book":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "canvas":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 8h14M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      );
    case "pulse":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-9 3 18 3-9h3" />
        </svg>
      );
    case "check":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "user":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
  }
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f172a] flex items-center justify-between px-4 sm:px-6 z-50">
        <div className="flex items-center gap-2.5">
          <div className="grid grid-cols-3 gap-0.5 w-5 h-5 shrink-0">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`rounded-[1px] ${i === 4 ? "bg-[#1E88E5]" : "bg-white"}`} />
            ))}
          </div>
          <span className="text-white font-bold text-sm">Portal do Mentorado</span>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-[#64748b] hover:text-white text-xs transition-colors">
            Sair
          </button>
        </form>
      </header>

      {/* Sidebar — desktop */}
      <aside className="hidden sm:flex fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-[#e2e8f0] flex-col pt-4 z-40">
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F7F8FC] hover:text-[#0f172a] transition-colors"
            >
              <NavIcon name={icon} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-[#e2e8f0]">
          <p className="text-[#94a3b8] text-xs text-center">Mentoria Carreira &amp; Decisão</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="sm:ml-56 pt-14 pb-20 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-8">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] flex z-50" aria-label="Navegação principal">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[#64748b] hover:text-[#1E88E5] transition-colors"
          >
            <NavIcon name={icon} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/5511940347276?text=Ol%C3%A1%2C+sou+seu+mentorado+e+gostaria+de+conversar."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg transition-colors"
        aria-label="Falar com mentor no WhatsApp"
      >
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Falar com mentor
      </a>
    </div>
  );
}
