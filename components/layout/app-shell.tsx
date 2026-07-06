"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  Settings2,
  Users,
  Wallet,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Site público", icon: ExternalLink, group: "Principal" },
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Principal" },
  { href: "/clientes", label: "Clientes", icon: Users, group: "Operação" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, group: "Operação" },
  { href: "/ordens", label: "Ordens de serviço", icon: ClipboardList, group: "Operação" },

  // Mantém a rota /cotacoes, mas deixa claro para uso real no sistema.
  { href: "/cotacoes", label: "Orçamentos", icon: FileText, group: "Operação" },

  { href: "/materiais", label: "Materiais", icon: Package, group: "Gestão" },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, group: "Gestão" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, group: "Gestão" },
  { href: "/backup", label: "Backup", icon: Database, group: "Sistema" },
  { href: "/sistemas", label: "Sistemas", icon: Settings2, group: "Sistema" }
];

const groups = ["Principal", "Operação", "Gestão", "Sistema"];

function getPageTitle(pathname: string) {
  const current = links.find((item) => item.href === pathname);
  return current?.label ?? "Sistema Volt";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const logged = localStorage.getItem("volt_logged");
    if (!logged && pathname !== "/login") {
      // Estrutura preparada para autenticação real.
    }
  }, [pathname]);

  function logout() {
    localStorage.removeItem("volt_logged");
    localStorage.removeItem("volt_login_date");
    router.push("/login");
  }

  const sidebarWidth = open ? "lg:pl-80" : "lg:pl-20";

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-[#070a0e]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          open ? "w-80" : "w-20"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4 py-4">
          <Link href="/" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black">
            <Image src="/img/logo.png" alt="Volt" width={40} height={40} className="rounded-xl" />
          </Link>

          {open && (
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-tight">Volt Soluções</p>
              <p className="text-[11px] uppercase tracking-[.22em] text-zinc-500">Sistema interno</p>
            </div>
          )}
        </div>

        {open && (
          <div className="m-3 rounded-3xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-volt-yellow text-black">
                <Zap size={19} />
              </div>
              <div>
                <p className="text-sm font-black text-volt-yellow">Operação online</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Gestão, OS, financeiro e sistemas técnicos</p>
              </div>
            </div>
          </div>
        )}

        <nav className="volt-scroll h-[calc(100vh-13rem)] overflow-y-auto p-3">
          {groups.map((group) => (
            <div key={group} className="mb-3">
              {open && <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.22em] text-zinc-600">{group}</p>}

              {links.filter((item) => item.group === group).map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                      active ? "bg-volt-yellow text-black shadow-glow" : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    {open && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/35 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm font-bold text-zinc-300 hover:bg-white/10"
          >
            <LogOut size={18} /> {open && "Sair do painel"}
          </button>
        </div>
      </aside>

      <main className={`transition-all duration-300 ${sidebarWidth}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#050505]/75 px-4 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => {
                setOpen(!open);
                setMobileOpen(true);
              }}
              className="btn-ghost inline-flex items-center gap-2"
            >
              <Menu size={18} /> Menu
            </button>

            <div className="hidden min-w-0 md:block">
              <p className="text-xs font-black uppercase tracking-[.22em] text-volt-yellow">Sistema</p>
              <h1 className="truncate text-xl font-black">{getPageTitle(pathname)}</h1>
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm text-zinc-500 xl:flex">
              <Search size={16} /> Buscar cliente, OS, orçamento...
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-black text-zinc-300 md:inline-flex items-center gap-2"
            >
              <ExternalLink size={17} /> Site
            </Link>

            <div className="text-right">
              <p className="text-sm font-black">Boa tarde, Guilherme</p>
              <p className="flex items-center justify-end gap-1 text-xs text-zinc-500">
                <Zap size={12} className="text-volt-yellow" /> {ready ? "Sistema online" : "Carregando"}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
