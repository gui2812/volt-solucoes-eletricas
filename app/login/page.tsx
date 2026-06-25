"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("Gui2812");
  const [password, setPassword] = useState("volt2026");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (user.trim().toLowerCase() === "gui2812" && password === "volt2026") {
      localStorage.setItem("volt_logged", "true");
      localStorage.setItem("volt_login_date", new Date().toISOString());
      router.push("/dashboard");
      return;
    }
    setError("Usuário ou senha incorretos.");
  }

  return (
    <main className="grid min-h-screen bg-[#050505] text-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 lg:block">
        <div className="absolute -left-20 top-16 h-96 w-96 rounded-full bg-volt-yellow/20 blur-[140px]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/img/logo.png" alt="Volt" width={58} height={58} className="rounded-2xl border border-white/10 bg-black" />
            <div>
              <p className="text-xl font-black">Volt Soluções Elétricas</p>
              <p className="text-[11px] uppercase tracking-[.28em] text-zinc-500">Sistema profissional</p>
            </div>
          </Link>

          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-volt-yellow/40 bg-volt-yellow/10 px-4 py-2 text-sm font-black text-volt-yellow">
              <ShieldCheck size={16} /> Área administrativa
            </div>
            <h1 className="text-6xl font-black leading-[.95] tracking-tight">Painel interno separado do site público.</h1>
            <p className="mt-6 text-lg leading-8 text-zinc-400">Clientes, agenda, OS, financeiro, relatórios e o simulador QDC ficam aqui dentro, com acesso dedicado para a operação da Volt.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Clientes", "OS", "QDC 3D"].map((item) => <div key={item} className="rounded-3xl border border-white/10 bg-white/[.04] p-4 text-center font-black text-zinc-300">{item}</div>)}
          </div>
        </div>
      </section>

      <section className="grid place-items-center px-5 py-10">
        <form onSubmit={submit} className="card-premium w-full max-w-md rounded-[2rem] p-8">
          <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Voltar ao site</Link>
          <div className="mb-8 flex flex-col items-center text-center">
            <Image src="/img/logo.png" alt="Volt" width={90} height={90} className="rounded-3xl" />
            <h1 className="mt-5 text-3xl font-black">Entrar no sistema</h1>
            <p className="mt-2 text-sm text-zinc-400">Painel profissional da Volt Soluções Elétricas.</p>
          </div>
          <label className="mb-2 block text-sm font-bold">Usuário</label>
          <input className="input-dark mb-4" value={user} onChange={(e) => setUser(e.target.value)} />
          <label className="mb-2 block text-sm font-bold">Senha</label>
          <input className="input-dark mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p>}
          <button className="btn-primary flex w-full items-center justify-center gap-2"><LockKeyhole size={18} /> Acessar painel</button>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500"><Zap size={13} className="text-volt-yellow" /> acesso demonstrativo local</p>
        </form>
      </section>
    </main>
  );
}
