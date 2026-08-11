"use client";

import {
  authenticationOptionsFromJSON,
  biometricErrorMessage,
  hasPlatformAuthenticator,
  serializeAuthenticationCredential,
  supportsWebAuthn,
  type AuthenticationOptionsJSON
} from "@/lib/webauthn-browser";
import { AlertTriangle, ArrowLeft, Fingerprint, Loader2, LockKeyhole, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const scopeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes",
  "/agenda": "Agenda",
  "/ordens": "Ordens de serviço",
  "/cotacoes": "Cotações",
  "/contratos": "Contratos",
  "/materiais": "Materiais",
  "/financeiro": "Financeiro",
  "/relatorios": "Relatórios",
  "/backup": "Backup",
  "/circuitos": "Central Técnica IA"
};

function ValidationContent() {
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") || "";
  const nextParam = searchParams.get("next") || "/dashboard";
  const reason = searchParams.get("reason");
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const autoAttempted = useRef(false);

  const safeNext = useMemo(() => (nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard"), [nextParam]);
  const areaName = scopeLabels[scope] || "Área protegida";

  const validate = useCallback(async (automatic = false) => {
    if (!scope || loading) return;
    setLoading(true);
    setError("");
    try {
      if (!window.isSecureContext) {
        throw new Error("A biometria exige acesso HTTPS seguro. Abra o sistema pelo endereço HTTPS publicado.");
      }

      const optionsResponse = await fetch("/api/security?action=auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope })
      });
      const optionsPayload = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(optionsPayload.error || "Não foi possível iniciar a validação.");

      const credential = await navigator.credentials.get({
        publicKey: authenticationOptionsFromJSON(optionsPayload.options as AuthenticationOptionsJSON),
        mediation: "required"
      });
      if (!(credential instanceof PublicKeyCredential)) throw new Error("A biometria não retornou uma credencial válida.");

      const verifyResponse = await fetch("/api/security?action=auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: serializeAuthenticationCredential(credential) })
      });
      const verifyPayload = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyPayload.verified) {
        throw new Error(verifyPayload.error || "Não foi possível validar: biometria ou dispositivo não autorizado.");
      }

      window.location.assign(safeNext);
    } catch (validationError) {
      if (automatic && validationError instanceof DOMException && validationError.name === "NotAllowedError") {
        setError("O pedido automático de biometria foi cancelado ou bloqueado pelo navegador. Toque em ‘Validar biometria’ para tentar novamente.");
      } else {
        setError(biometricErrorMessage(validationError));
      }
    } finally {
      setLoading(false);
    }
  }, [loading, safeNext, scope]);

  useEffect(() => {
    const webAuthnSupported = supportsWebAuthn();
    setSupported(webAuthnSupported);
    if (!webAuthnSupported) {
      setPlatformAvailable(false);
      return;
    }

    void hasPlatformAuthenticator().then((available) => {
      setPlatformAvailable(available);
      if (available && !autoAttempted.current) {
        autoAttempted.current = true;
        window.setTimeout(() => void validate(true), 250);
      }
    });
  }, [validate]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#050505] px-5 py-10 text-white">
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt-yellow/10 blur-[160px]" />
      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#090b0e]/95 shadow-2xl">
        <div className="border-b border-white/10 bg-white/[.025] p-6 text-center sm:p-8">
          <Image src="/img/logo.png" alt="Volt" width={76} height={76} className="mx-auto rounded-3xl border border-white/10 bg-black" />
          <div className="mx-auto mt-6 grid h-20 w-20 place-items-center rounded-[1.7rem] border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">
            <Fingerprint size={38} />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.24em] text-volt-yellow">Segurança biométrica</p>
          <h1 className="mt-2 text-3xl font-black">Validar acesso a {areaName}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Confirme sua identidade usando a biometria segura cadastrada no aparelho para liberar esta seção.
          </p>
        </div>

        <div className="space-y-4 p-6 sm:p-8">
          {reason === "security-unavailable" && (
            <div className="flex gap-3 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4 text-amber-100">
              <AlertTriangle className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm leading-6">A configuração de segurança não pôde ser consultada. Por proteção, Financeiro e Contratos permanecem bloqueados até o Supabase responder.</p>
            </div>
          )}

          {!supported && (
            <div className="flex gap-3 rounded-3xl border border-red-400/25 bg-red-500/10 p-4 text-red-200">
              <AlertTriangle className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm leading-6">Este navegador não oferece suporte ao padrão de segurança WebAuthn.</p>
            </div>
          )}

          {platformAvailable === false && supported && (
            <div className="flex gap-3 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4 text-amber-100">
              <LockKeyhole className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm leading-6">Não foi encontrada biometria local disponível. Verifique se Face ID, Windows Hello ou a biometria do aparelho está configurada.</p>
            </div>
          )}

          {error && (
            <div className="flex gap-3 rounded-3xl border border-red-400/25 bg-red-500/10 p-4 text-red-200">
              <AlertTriangle className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm font-bold leading-6">{error}</p>
            </div>
          )}

          <button
            type="button"
            disabled={loading || !supported}
            onClick={() => void validate(false)}
            className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Fingerprint size={20} />}
            {loading ? "Aguardando biometria..." : "Validar biometria"}
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[.03] p-4">
              <ShieldCheck className="text-volt-yellow" size={20} />
              <p className="mt-2 text-sm font-black">Rosto não é armazenado</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">O sistema guarda somente a chave pública do dispositivo autorizado.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[.03] p-4">
              <Zap className="text-volt-yellow" size={20} />
              <p className="mt-2 text-sm font-black">Desbloqueio temporário</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Após validar, esta seção fica liberada por alguns minutos neste navegador.</p>
            </div>
          </div>

          <Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-zinc-400 transition hover:text-white">
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function BiometricValidationPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#050505] text-white"><Loader2 className="animate-spin text-volt-yellow" size={32} /></main>}>
      <ValidationContent />
    </Suspense>
  );
}
