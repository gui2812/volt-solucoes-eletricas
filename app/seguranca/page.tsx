"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  authenticationOptionsFromJSON,
  biometricErrorMessage,
  hasPlatformAuthenticator,
  registrationOptionsFromJSON,
  serializeAuthenticationCredential,
  serializeRegistrationCredential,
  supportsWebAuthn,
  type AuthenticationOptionsJSON,
  type RegistrationOptionsJSON
} from "@/lib/webauthn-browser";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  MonitorSmartphone,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CredentialMeta = {
  credentialId: string;
  label: string;
  transports: string[];
  deviceType?: string | null;
  backedUp?: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
};

type SecurityStatus = {
  protectedRoutes: string[];
  credentials: CredentialMeta[];
  managementAuthorized: boolean;
  biometricAvailable: boolean;
};

const modules = [
  { route: "/dashboard", title: "Dashboard", description: "Indicadores e visão geral da operação." },
  { route: "/clientes", title: "Clientes", description: "Cadastro, documentos e histórico dos clientes." },
  { route: "/agenda", title: "Agenda", description: "Visitas, compromissos e cronograma." },
  { route: "/ordens", title: "Ordens de serviço", description: "OS, execução e evidências técnicas." },
  { route: "/cotacoes", title: "Cotações", description: "Orçamentos, valores e propostas comerciais." },
  { route: "/contratos", title: "Contratos", description: "Contratos, assinaturas e dados sensíveis." },
  { route: "/materiais", title: "Materiais", description: "Catálogo, estoque e listas de materiais." },
  { route: "/financeiro", title: "Financeiro", description: "Receitas, despesas, caixa e metas." },
  { route: "/relatorios", title: "Relatórios", description: "Relatórios executivos e consolidados." },
  { route: "/backup", title: "Backup", description: "Rotinas e dados de segurança do sistema." },
  { route: "/circuitos", title: "Central Técnica IA", description: "Dimensionamentos e recursos técnicos." }
];

function formatDateTime(value?: string | null) {
  if (!value) return "Ainda não utilizada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a operação.");
  return payload;
}

export default function SecurityPage() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [deviceLabel, setDeviceLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [webAuthnSupported, setWebAuthnSupported] = useState(true);
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);

  const protectedCount = selectedRoutes.length;
  const changed = useMemo(() => {
    if (!status) return false;
    const a = [...selectedRoutes].sort().join("|");
    const b = [...status.protectedRoutes].sort().join("|");
    return a !== b;
  }, [selectedRoutes, status]);

  async function loadStatus(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/security?action=status", { cache: "no-store" });
      const payload = (await readJson(response)) as SecurityStatus;
      setStatus(payload);
      setSelectedRoutes(payload.protectedRoutes || []);
    } catch (statusError) {
      setError(biometricErrorMessage(statusError));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    const supported = supportsWebAuthn();
    setWebAuthnSupported(supported);
    if (supported) void hasPlatformAuthenticator().then(setPlatformAvailable);
    else setPlatformAvailable(false);
    void loadStatus();
  }, []);

  async function authenticateManagement() {
    if (!status?.credentials.length) return true;
    if (status.managementAuthorized) return true;

    setBusy("management");
    setError("");
    try {
      const optionsResponse = await fetch("/api/security?action=auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "security-manage" })
      });
      const optionsPayload = await readJson(optionsResponse);
      const credential = await navigator.credentials.get({
        publicKey: authenticationOptionsFromJSON(optionsPayload.options as AuthenticationOptionsJSON)
      });
      if (!(credential instanceof PublicKeyCredential)) throw new Error("A biometria não retornou uma credencial válida.");

      const verifyResponse = await fetch("/api/security?action=auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: serializeAuthenticationCredential(credential) })
      });
      await readJson(verifyResponse);
      setStatus((current) => (current ? { ...current, managementAuthorized: true } : current));
      return true;
    } catch (authError) {
      setError(biometricErrorMessage(authError));
      return false;
    } finally {
      setBusy("");
    }
  }

  async function registerBiometric() {
    if (!webAuthnSupported) {
      setError("Este navegador não oferece suporte ao padrão WebAuthn.");
      return;
    }
    if (status?.credentials.length && !(await authenticateManagement())) return;

    setBusy("register");
    setError("");
    setMessage("");
    try {
      const optionsResponse = await fetch("/api/security?action=register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: deviceLabel })
      });
      const optionsPayload = await readJson(optionsResponse);
      const credential = await navigator.credentials.create({
        publicKey: registrationOptionsFromJSON(optionsPayload.options as RegistrationOptionsJSON)
      });
      if (!(credential instanceof PublicKeyCredential)) throw new Error("O aparelho não retornou uma credencial biométrica válida.");

      const verifyResponse = await fetch("/api/security?action=register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: deviceLabel,
          credential: serializeRegistrationCredential(credential)
        })
      });
      await readJson(verifyResponse);
      setMessage("Biometria cadastrada e autorizada com sucesso.");
      setDeviceLabel("");
      await loadStatus(true);
    } catch (registrationError) {
      setError(biometricErrorMessage(registrationError));
    } finally {
      setBusy("");
    }
  }

  async function saveProtection() {
    if (selectedRoutes.length > 0 && !status?.credentials.length) {
      setError("Cadastre ao menos uma biometria antes de proteger as abas.");
      return;
    }
    if (status?.credentials.length && !(await authenticateManagement())) return;

    setBusy("save");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protectedRoutes: selectedRoutes })
      });
      const payload = await readJson(response);
      setStatus((current) => (current ? { ...current, protectedRoutes: payload.protectedRoutes || selectedRoutes } : current));
      setMessage("Proteção biométrica das abas atualizada.");
    } catch (saveError) {
      setError(biometricErrorMessage(saveError));
    } finally {
      setBusy("");
    }
  }

  async function removeCredential(credential: CredentialMeta) {
    if (!window.confirm(`Remover a biometria “${credential.label}”?`)) return;
    if (!(await authenticateManagement())) return;

    setBusy(`remove:${credential.credentialId}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/security?credentialId=${encodeURIComponent(credential.credentialId)}`, { method: "DELETE" });
      await readJson(response);
      setMessage("Biometria removida.");
      await loadStatus(true);
    } catch (removeError) {
      setError(biometricErrorMessage(removeError));
    } finally {
      setBusy("");
    }
  }

  function toggleRoute(route: string) {
    setSelectedRoutes((current) => current.includes(route) ? current.filter((item) => item !== route) : [...current, route]);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="grid min-h-[65vh] place-items-center"><Loader2 className="animate-spin text-volt-yellow" size={34} /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#090b0e] p-6 md:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-volt-yellow/10 blur-[120px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-volt-yellow/25 bg-volt-yellow/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-volt-yellow">
                <ShieldCheck size={16} /> Central de segurança
              </div>
              <h1 className="mt-4 text-3xl font-black md:text-4xl">Biometria para proteger as áreas sensíveis</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Cadastre os dispositivos autorizados e marque exatamente quais abas devem exigir Face ID, Windows Hello, digital ou outra verificação segura oferecida pelo aparelho.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4 text-center">
                <p className="text-3xl font-black text-volt-yellow">{status?.credentials.length || 0}</p><p className="mt-1 text-xs text-zinc-500">biometrias</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4 text-center">
                <p className="text-3xl font-black text-volt-yellow">{protectedCount}</p><p className="mt-1 text-xs text-zinc-500">abas protegidas</p>
              </div>
              <div className="hidden rounded-3xl border border-white/10 bg-white/[.035] p-4 text-center sm:block">
                <p className="text-lg font-black text-volt-yellow">WebAuthn</p><p className="mt-1 text-xs text-zinc-500">chave pública</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex gap-3 rounded-3xl border border-red-400/25 bg-red-500/10 p-4 text-red-200">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-bold leading-6">{error}</p>
          </div>
        )}
        {message && (
          <div className="flex gap-3 rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-200">
            <BadgeCheck className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-bold leading-6">{message}</p>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <div className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-volt-yellow">Cadastro biométrico</p>
                <h2 className="mt-2 text-2xl font-black">Dispositivos autorizados</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">Dê um nome fácil de reconhecer, como “iPhone Guilherme” ou “Notebook Escritório”.</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-volt-yellow text-black"><Fingerprint size={23} /></div>
            </div>

            {!webAuthnSupported || platformAvailable === false ? (
              <div className="mt-5 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                {!webAuthnSupported
                  ? "Este navegador não suporta WebAuthn. Use uma versão atual do Chrome, Edge ou Safari."
                  : "Não foi encontrada biometria local. Configure Face ID, Windows Hello ou a biometria do aparelho antes de cadastrar."}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                className="input-dark flex-1"
                placeholder="Ex.: iPhone Guilherme"
                value={deviceLabel}
                onChange={(event) => setDeviceLabel(event.target.value)}
                maxLength={80}
              />
              <button
                type="button"
                onClick={registerBiometric}
                disabled={busy !== "" || !webAuthnSupported}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "register" || busy === "management" ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Cadastrar biometria
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {!status?.credentials.length && (
                <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center">
                  <Fingerprint className="mx-auto text-zinc-700" size={32} />
                  <p className="mt-3 font-black text-zinc-300">Nenhuma biometria cadastrada</p>
                  <p className="mt-1 text-sm text-zinc-600">Cadastre o primeiro aparelho antes de ativar a proteção das abas.</p>
                </div>
              )}

              {status?.credentials.map((credential) => (
                <div key={credential.credentialId} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 text-volt-yellow">
                        {credential.transports.includes("internal") ? <Smartphone size={20} /> : <MonitorSmartphone size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-zinc-100">{credential.label}</p>
                        <p className="mt-1 text-xs text-zinc-500">Cadastrada em {formatDateTime(credential.createdAt)}</p>
                        <p className="mt-1 text-xs text-zinc-600">Último uso: {formatDateTime(credential.lastUsedAt)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Remover biometria"
                      onClick={() => removeCredential(credential)}
                      disabled={busy !== ""}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-red-400/15 text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                    >
                      {busy === `remove:${credential.credentialId}` ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[.03] p-4">
              <div className="flex gap-3">
                <KeyRound className="mt-0.5 shrink-0 text-volt-yellow" size={19} />
                <div>
                  <p className="text-sm font-black">Sem foto facial no banco</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">O Supabase armazena a chave pública e o identificador do dispositivo. A biometria permanece protegida pelo sistema operacional do aparelho.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-volt-yellow">Proteção por aba</p>
                <h2 className="mt-2 text-2xl font-black">Onde exigir biometria?</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">Marque ou desmarque as áreas. Ao entrar nelas, o sistema exige uma credencial biométrica autorizada.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoutes(["/contratos", "/financeiro"])}
                className="btn-ghost inline-flex shrink-0 items-center justify-center gap-2"
              >
                <LockKeyhole size={17} /> Recomendado
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {modules.map((module) => {
                const active = selectedRoutes.includes(module.route);
                return (
                  <button
                    type="button"
                    key={module.route}
                    onClick={() => toggleRoute(module.route)}
                    className={`flex items-start gap-3 rounded-3xl border p-4 text-left transition ${active ? "border-volt-yellow/35 bg-volt-yellow/10" : "border-white/10 bg-black/20 hover:bg-white/[.035]"}`}
                  >
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${active ? "border-volt-yellow bg-volt-yellow text-black" : "border-white/10 text-zinc-600"}`}>
                      {active ? <Check size={17} /> : <Fingerprint size={17} />}
                    </span>
                    <span>
                      <span className="block font-black text-zinc-100">{module.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500">{module.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-black">{protectedCount} área(s) selecionada(s)</p>
                <p className="mt-1 text-xs text-zinc-500">Alterações só entram em vigor depois de salvar.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => loadStatus()} disabled={busy !== ""} className="btn-ghost inline-flex items-center gap-2">
                  <RefreshCcw size={16} /> Restaurar
                </button>
                <button type="button" onClick={saveProtection} disabled={busy !== "" || !changed} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy === "save" || busy === "management" ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                  Salvar proteção
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[.03] p-5">
            <ShieldCheck className="text-volt-yellow" size={24} />
            <p className="mt-3 font-black">Bloqueio antes da página</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">A rota protegida não é exibida antes da validação. O middleware interrompe o acesso e redireciona para a tela biométrica.</p>
          </div>
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[.03] p-5">
            <Fingerprint className="text-volt-yellow" size={24} />
            <p className="mt-3 font-black">Biometria obrigatória</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">A credencial exige verificação do usuário. No iPhone pode ser Face ID; no Windows, Windows Hello; em outros aparelhos, a biometria segura disponível.</p>
          </div>
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[.03] p-5">
            <LockKeyhole className="text-volt-yellow" size={24} />
            <p className="mt-3 font-black">Proteção contra bloqueio acidental</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">O sistema não permite excluir a última biometria enquanto ainda existir alguma aba marcada como protegida.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
