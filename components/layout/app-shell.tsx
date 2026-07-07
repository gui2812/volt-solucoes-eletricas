"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CircuitBoard,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
  Zap
} from "lucide-react";

type AppShellProps = {
  children: ReactNode;
};

const links = [
  { href: "/", label: "Site público", icon: ExternalLink, group: "Principal" },
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Principal" },
  { href: "/clientes", label: "Clientes", icon: Users, group: "Operação" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, group: "Operação" },
  { href: "/ordens", label: "Ordens de serviço", icon: ClipboardList, group: "Operação" },
  { href: "/cotacoes", label: "Cotações", icon: FileText, group: "Operação" },
  { href: "/materiais", label: "Materiais", icon: Package, group: "Gestão" },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, group: "Gestão" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, group: "Gestão" },
  { href: "/backup", label: "Backup", icon: Database, group: "Sistema" },
  { href: "/circuitos", label: "QDC 3D", icon: CircuitBoard, group: "Sistema" }
];

const groups = ["Principal", "Operação", "Gestão", "Sistema"];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const activePage = useMemo(() => {
    const current = links.find((item) => {
      if (item.href === "/") return pathname === "/";
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    });

    return current ?? links.find((item) => item.href === "/dashboard");
  }, [pathname]);

  useEffect(() => {
    setReady(true);
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // Mesmo se a chamada falhar, limpa a sessão antiga local e manda para o login.
    }

    localStorage.removeItem("volt_logged");
    localStorage.removeItem("volt_login_date");
    router.push("/login");
    router.refresh();
  }

  const sidebarWidth = sidebarOpen ? "lg:pl-80" : "lg:pl-24";

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[#070a0e]/95 shadow-2xl backdrop-blur-xl transition-all duration-300",
          sidebarOpen ? "lg:w-80" : "lg:w-24",
          mobileOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full lg:translate-x-0"
        ].join(" ")}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4 py-4">
          <Link
            href="/"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black"
          >
            <Image src="/img/logo.png" alt="Volt" width={40} height={40} className="rounded-xl" />
          </Link>

          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black leading-tight">Volt Soluções</p>
              <p className="text-[11px] uppercase tracking-[.22em] text-zinc-500">
                Sistema interno
              </p>
            </div>
          )}

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-zinc-300 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-3 mt-3 rounded-3xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-volt-yellow text-black">
              <ShieldCheck size={20} />
            </div>

            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-volt-yellow">Operação online</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Gestão, OS, financeiro e QDC
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="volt-scroll flex-1 overflow-y-auto p-3">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              {sidebarOpen && (
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.22em] text-zinc-600">
                  {group}
                </p>
              )}

              {links
                .filter((item) => item.group === group)
                .map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={[
                        "mb-1 flex items-center rounded-2xl px-3 py-3 text-sm font-bold transition",
                        sidebarOpen ? "gap-3" : "justify-center",
                        active
                          ? "bg-volt-yellow text-black shadow-glow"
                          : "text-zinc-300 hover:bg-white/10 hover:text-white"
                      ].join(" ")}
                    >
                      <Icon size={19} className="shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 bg-black/35 p-3">
          <button
            type="button"
            onClick={logout}
            className={[
              "flex w-full items-center rounded-2xl border border-white/10 px-3 py-3 text-sm font-bold text-zinc-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200",
              sidebarOpen ? "gap-3" : "justify-center"
            ].join(" ")}
          >
            <LogOut size={18} />
            {sidebarOpen && "Sair do painel"}
          </button>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${sidebarWidth}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="btn-ghost inline-flex items-center gap-2 lg:hidden"
              >
                <Menu size={18} />
              </button>

              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn-ghost hidden items-center gap-2 lg:inline-flex"
              >
                <Menu size={18} />
                Menu
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase tracking-[.16em] text-volt-yellow">
                  {activePage?.group ?? "Painel"}
                </p>
                <h1 className="truncate text-lg font-black leading-tight md:text-2xl">
                  {activePage?.label ?? "Dashboard"}
                </h1>
              </div>
            </div>

            <div className="hidden min-w-[320px] items-center gap-2 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm text-zinc-500 xl:flex">
              <Search size={16} />
              Buscar cliente, OS, orçamento...
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/"
                className="hidden rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-volt-yellow/30 hover:text-volt-yellow md:inline-flex md:items-center md:gap-2"
              >
                <ExternalLink size={17} />
                Site
              </Link>

              <Link
                href="/circuitos"
                className="hidden rounded-2xl border border-volt-yellow/30 bg-volt-yellow/10 px-4 py-3 text-sm font-black text-volt-yellow transition hover:bg-volt-yellow hover:text-black md:inline-flex md:items-center md:gap-2"
              >
                <CircuitBoard size={17} />
                QDC 3D
              </Link>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-black">{getGreeting()}, Guilherme</p>
                <p className="flex items-center justify-end gap-1 text-xs text-zinc-500">
                  <Zap size={12} className="text-volt-yellow" />
                  {ready ? "Sistema online" : "Carregando"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 md:px-6 md:py-6">{children}</div>
      </main>
    </div>
  );
}
