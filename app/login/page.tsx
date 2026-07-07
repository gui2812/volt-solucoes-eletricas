"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck, Zap } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Usuário ou senha incorretos.");
      }

      localStorage.removeItem("volt_logged");
      localStorage.removeItem("volt_login_date");

      router.push(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao entrar no sistema.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-premium w-full max-w-md rounded-[2rem] p-8">
      <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
        <ArrowLeft size={16} /> Voltar ao site
      </Link>

      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/img/logo.png" alt="Volt" width={90} height={90} className="rounded-3xl" />
        <h1 className="mt-5 text-3xl font-black">Entrar no sistema</h1>
        <p className="mt-2 text-sm text-zinc-400">Acesso seguro ao painel interno da Volt.</p>
      </div>

      <label className="mb-2 block text-sm font-bold">Usuário</label>
      <input
        className="input-dark mb-4"
        value={user}
        onChange={(event) => setUser(event.target.value)}
        autoComplete="username"
        placeholder="Digite seu usuário"
      />

      <label className="mb-2 block text-sm font-bold">Senha</label>
      <div className="mb-4 flex items-center rounded-2xl border border-white/10 bg-white/[.035] pr-2">
        <input
          className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-zinc-600"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Digite sua senha"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LockKeyhole size={18} /> {loading ? "Verificando..." : "Acessar painel"}
      </button>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <Zap size={13} className="text-volt-yellow" /> sessão protegida por cookie seguro
      </p>
    </form>
  );
}

export default function LoginPage() {
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

            <h1 className="text-6xl font-black leading-[.95] tracking-tight">Painel interno protegido por login real.</h1>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              O usuário e a senha não ficam mais expostos no código nem preenchidos automaticamente na tela.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Sessão segura", "Cookie HttpOnly", "Sem senha no front"].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/[.04] p-4 text-center font-black text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid place-items-center px-5 py-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
