import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "volt_session";
const BIOMETRIC_COOKIE = "volt_biometric_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
const BIOMETRIC_MAX_AGE_MS = 1000 * 60 * 10;
const FAIL_CLOSED_ROUTES = ["/contratos", "/financeiro"];

function getAuthSecret() {
  return process.env.VOLT_AUTH_SECRET?.trim() || "";
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(signature);
}

async function isValidSession(token?: string) {
  const secret = getAuthSecret();
  if (!secret || !token) return false;
  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature) return false;
  const createdAt = Number(timestamp);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_MAX_AGE_MS) return false;
  return (await signValue(timestamp, secret)) === signature;
}


function decodeScope(encodedScope: string) {
  try {
    const normalized = encodedScope.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

async function readBiometricSession(token?: string) {
  const secret = getAuthSecret();
  if (!secret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [timestamp, encodedScope, credentialId, signature] = parts;
  const payload = `${timestamp}.${encodedScope}.${credentialId}`;
  const createdAt = Number(timestamp);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > BIOMETRIC_MAX_AGE_MS) return null;
  if ((await signValue(payload, secret)) !== signature) return null;

  const scope = decodeScope(encodedScope);
  if (!scope) return null;
  return { scope, credentialId, createdAt };
}

function routeScope(pathname: string) {
  const first = `/${pathname.split("/").filter(Boolean)[0] || ""}`;
  return first === "/" ? "" : first;
}


async function apiSecurityScope(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/security")) return "";
  if (pathname.startsWith("/api/finance")) return "/financeiro";
  if (pathname.startsWith("/api/clients") || pathname.startsWith("/api/leads") || pathname.startsWith("/api/client-documents")) return "/clientes";
  if (pathname.startsWith("/api/ai/dimensioning")) return "/circuitos";
  if (pathname.startsWith("/api/ai/estimate")) return "/cotacoes";
  if (pathname === "/api/signature/create") {
    try {
      const body = await request.clone().json() as { documentType?: unknown; quoteSnapshot?: { documentType?: unknown } };
      const documentType = body.documentType === "contract" || body.quoteSnapshot?.documentType === "contract" ? "contract" : "quote";
      return documentType === "contract" ? "/contratos" : "/cotacoes";
    } catch {
      return "/cotacoes";
    }
  }
  if (pathname === "/api/signature/email/send") {
    try {
      const body = await request.clone().json() as { signingUrl?: unknown };
      const signingUrl = typeof body.signingUrl === "string" ? body.signingUrl : "";
      return signingUrl.includes("/assinar-contrato/") ? "/contratos" : "/cotacoes";
    } catch {
      return "/cotacoes";
    }
  }
  if (pathname.startsWith("/api/business-documents")) {
    let type = request.nextUrl.searchParams.get("type") || "";
    if (!type && request.method !== "GET") {
      try {
        const body = await request.clone().json() as { type?: unknown };
        type = typeof body.type === "string" ? body.type : "";
      } catch {
        type = "";
      }
    }
    if (type === "contract" || type === "company_profile") return "/contratos";
    if (type === "quote") return "/cotacoes";
  }
  return "";
}

async function getProtectedRoutes() {
  const url = process.env.SUPABASE_URL?.trim()?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return { routes: FAIL_CLOSED_ROUTES, available: false };

  try {
    const response = await fetch(
      `${url}/rest/v1/app_security_settings?id=eq.global&select=protected_routes&limit=1`,
      {
        cache: "no-store",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) return { routes: FAIL_CLOSED_ROUTES, available: false };
    const rows = (await response.json()) as Array<{ protected_routes?: unknown }>;
    const routes = Array.isArray(rows[0]?.protected_routes)
      ? rows[0].protected_routes.filter((route): route is string => typeof route === "string")
      : [];
    return { routes, available: true };
  } catch {
    return { routes: FAIL_CLOSED_ROUTES, available: false };
  }
}

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionValid = await isValidSession(sessionToken);

  if (!sessionValid) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sua sessão expirou. Entre novamente no sistema." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const pathname = request.nextUrl.pathname;

  // As rotas de segurança fazem a própria verificação WebAuthn e precisam
  // permanecer acessíveis depois que a sessão principal foi validada.
  if (pathname.startsWith("/api/security")) return NextResponse.next();
  if (pathname === "/seguranca" || pathname.startsWith("/seguranca/") || pathname === "/validar-biometria") {
    return NextResponse.next();
  }

  const scope = pathname.startsWith("/api/") ? await apiSecurityScope(request) : routeScope(pathname);
  if (!scope) return NextResponse.next();

  const security = await getProtectedRoutes();
  if (!security.routes.includes(scope)) return NextResponse.next();

  const biometric = await readBiometricSession(request.cookies.get(BIOMETRIC_COOKIE)?.value);
  if (biometric?.scope === scope) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Validação biométrica obrigatória para acessar estes dados.", requiresBiometric: true, scope },
      { status: 403 }
    );
  }

  const validationUrl = new URL("/validar-biometria", request.url);
  validationUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  validationUrl.searchParams.set("scope", scope);
  if (!security.available) validationUrl.searchParams.set("reason", "security-unavailable");
  return NextResponse.redirect(validationUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/agenda/:path*",
    "/ordens/:path*",
    "/cotacoes/:path*",
    "/contratos/:path*",
    "/materiais/:path*",
    "/financeiro/:path*",
    "/relatorios/:path*",
    "/backup/:path*",
    "/sistemas/:path*",
    "/circuitos/:path*",
    "/seguranca",
    "/seguranca/:path*",
    "/validar-biometria",
    "/validar-biometria/:path*",
    "/api/clients",
    "/api/clients/:path*",
    "/api/leads",
    "/api/leads/:path*",
    "/api/client-documents",
    "/api/client-documents/:path*",
    "/api/finance",
    "/api/finance/:path*",
    "/api/signature/create",
    "/api/signature/email/send",
    "/api/signature/cancel/:path*",
    "/api/signature/by-quote/:path*",
    "/api/ai/:path*",
    "/api/business-documents",
    "/api/business-documents/:path*",
    "/api/security",
    "/api/security/:path*"
  ]
};
