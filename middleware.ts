import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "volt_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 12;

function getAuthSecret() {
  return process.env.VOLT_AUTH_SECRET?.trim() || "";
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signSession(timestamp: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp)
  );

  return bytesToHex(signature);
}

async function isValidSession(token?: string) {
  const secret = getAuthSecret();

  if (!secret || !token) return false;

  const [timestamp, signature] = token.split(".");

  if (!timestamp || !signature) return false;

  const createdAt = Number(timestamp);

  if (!Number.isFinite(createdAt)) return false;

  if (Date.now() - createdAt > MAX_AGE_MS) return false;

  const expected = await signSession(timestamp, secret);

  return expected === signature;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidSession(token);

  if (valid) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/agenda/:path*",
    "/ordens/:path*",
    "/cotacoes/:path*",
    "/materiais/:path*",
    "/financeiro/:path*",
    "/relatorios/:path*",
    "/backup/:path*",
    "/sistemas/:path*",
    "/circuitos/:path*"
  ]
};
