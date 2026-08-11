import { createHash, createHmac, randomBytes, timingSafeEqual, webcrypto } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_TABLE = "app_security_settings";
const CREDENTIALS_TABLE = "app_webauthn_credentials";
const SETTINGS_ID = "global";
const CHALLENGE_COOKIE = "volt_webauthn_challenge";
const BIOMETRIC_COOKIE = "volt_biometric_session";
const CHALLENGE_MAX_AGE_SECONDS = 5 * 60;
const ROUTE_UNLOCK_MAX_AGE_SECONDS = 10 * 60;
const MANAGEMENT_UNLOCK_MAX_AGE_SECONDS = 5 * 60;

const ALLOWED_ROUTES = new Set([
  "/dashboard",
  "/clientes",
  "/agenda",
  "/ordens",
  "/cotacoes",
  "/contratos",
  "/materiais",
  "/financeiro",
  "/relatorios",
  "/backup",
  "/circuitos"
]);

const MANAGEMENT_SCOPE = "security-manage";

type JsonMap = Record<string, unknown>;
type StoredCredential = {
  credential_id: string;
  label: string;
  public_key: string;
  algorithm: number;
  counter: number | string;
  transports: string[] | null;
  device_type: string | null;
  backed_up: boolean | null;
  created_at: string;
  last_used_at: string | null;
};

type CborResult = { value: unknown; nextOffset: number };

function getAuthSecret() {
  const secret = process.env.VOLT_AUTH_SECRET?.trim();
  if (!secret) throw new Error("VOLT_AUTH_SECRET não configurado.");
  return secret;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.");
  return { url: url.replace(/\/$/, ""), key };
}

function supabaseHeaders(key: string, extra?: HeadersInit) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: supabaseHeaders(key, init?.headers)
  });
  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }
  return { ok: response.ok, status: response.status, data };
}

function base64UrlEncode(input: Uint8Array | Buffer | ArrayBuffer) {
  const buffer = input instanceof ArrayBuffer ? Buffer.from(input) : Buffer.from(input);
  return buffer.toString("base64url");
}

function base64UrlDecode(input: string) {
  return new Uint8Array(Buffer.from(input, "base64url"));
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function hmac(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

function encodeScope(scope: string) {
  return Buffer.from(scope, "utf8").toString("base64url");
}

function decodeScope(encodedScope: string) {
  return Buffer.from(encodedScope, "base64url").toString("utf8");
}

function createChallengeCookie(kind: "register" | "auth", challenge: string, scope: string) {
  const timestamp = Date.now().toString();
  const encodedScope = encodeScope(scope);
  const payload = `${kind}.${timestamp}.${encodedScope}.${challenge}`;
  return `${payload}.${hmac(payload)}`;
}

function readChallengeCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const raw = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CHALLENGE_COOKIE}=`))
    ?.slice(CHALLENGE_COOKIE.length + 1);
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 5) return null;
  const [kind, timestamp, encodedScope, challenge, signature] = parts;
  const payload = `${kind}.${timestamp}.${encodedScope}.${challenge}`;
  if (!safeEqual(hmac(payload), signature)) return null;
  const createdAt = Number(timestamp);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > CHALLENGE_MAX_AGE_SECONDS * 1000) return null;
  if (kind !== "register" && kind !== "auth") return null;

  return {
    kind: kind as "register" | "auth",
    challenge,
    scope: decodeScope(encodedScope)
  };
}

function createBiometricToken(scope: string, credentialId: string) {
  const timestamp = Date.now().toString();
  const encodedScope = encodeScope(scope);
  const payload = `${timestamp}.${encodedScope}.${credentialId}`;
  return `${payload}.${hmac(payload)}`;
}

function readBiometricToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const raw = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${BIOMETRIC_COOKIE}=`))
    ?.slice(BIOMETRIC_COOKIE.length + 1);
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [timestamp, encodedScope, credentialId, signature] = parts;
  const payload = `${timestamp}.${encodedScope}.${credentialId}`;
  if (!safeEqual(hmac(payload), signature)) return null;
  const createdAt = Number(timestamp);
  if (!Number.isFinite(createdAt)) return null;
  return { createdAt, scope: decodeScope(encodedScope), credentialId };
}

function hasManagementAuthorization(request: Request) {
  const token = readBiometricToken(request);
  return Boolean(
    token &&
      token.scope === MANAGEMENT_SCOPE &&
      Date.now() - token.createdAt <= MANAGEMENT_UNLOCK_MAX_AGE_SECONDS * 1000
  );
}

function setChallengeCookie(response: NextResponse, value: string) {
  response.cookies.set(CHALLENGE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE_SECONDS
  });
}

function clearChallengeCookie(response: NextResponse) {
  response.cookies.set(CHALLENGE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

function setBiometricCookie(response: NextResponse, scope: string, credentialId: string) {
  response.cookies.set(BIOMETRIC_COOKIE, createBiometricToken(scope, credentialId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: scope === MANAGEMENT_SCOPE ? MANAGEMENT_UNLOCK_MAX_AGE_SECONDS : ROUTE_UNLOCK_MAX_AGE_SECONDS
  });
}

function getRpConfig(request: Request) {
  const requestUrl = new URL(request.url);
  const configuredOrigin = process.env.WEBAUTHN_ORIGIN?.trim().replace(/\/$/, "");
  const origin = configuredOrigin || requestUrl.origin;
  const configuredRpId = process.env.WEBAUTHN_RP_ID?.trim();
  const rpID = configuredRpId || new URL(origin).hostname;
  return { origin, rpID, rpName: "Volt Soluções Elétricas" };
}

async function getSettings() {
  const response = await supabaseFetch(
    `${SETTINGS_TABLE}?id=eq.${encodeURIComponent(SETTINGS_ID)}&select=protected_routes,updated_at&limit=1`
  );
  if (!response.ok) throw new Error("Não foi possível carregar as configurações de segurança.");
  const rows = Array.isArray(response.data) ? (response.data as JsonMap[]) : [];
  const protectedRoutes = Array.isArray(rows[0]?.protected_routes)
    ? (rows[0].protected_routes as unknown[]).filter((route): route is string => typeof route === "string")
    : [];
  return { protectedRoutes: protectedRoutes.filter((route) => ALLOWED_ROUTES.has(route)), updatedAt: rows[0]?.updated_at };
}

async function listCredentials() {
  const response = await supabaseFetch(
    `${CREDENTIALS_TABLE}?select=credential_id,label,public_key,algorithm,counter,transports,device_type,backed_up,created_at,last_used_at&order=created_at.asc`
  );
  if (!response.ok) throw new Error("Não foi possível carregar as biometrias cadastradas.");
  return (Array.isArray(response.data) ? response.data : []) as StoredCredential[];
}

async function getCredential(credentialId: string) {
  const response = await supabaseFetch(
    `${CREDENTIALS_TABLE}?credential_id=eq.${encodeURIComponent(credentialId)}&select=credential_id,label,public_key,algorithm,counter,transports,device_type,backed_up,created_at,last_used_at&limit=1`
  );
  if (!response.ok) throw new Error("Falha ao consultar credencial biométrica.");
  const rows = Array.isArray(response.data) ? (response.data as StoredCredential[]) : [];
  return rows[0] || null;
}

function readLength(data: Uint8Array, offset: number, additional: number) {
  if (additional < 24) return { length: additional, offset };
  if (additional === 24) return { length: data[offset], offset: offset + 1 };
  if (additional === 25) {
    const view = new DataView(data.buffer, data.byteOffset + offset, 2);
    return { length: view.getUint16(0), offset: offset + 2 };
  }
  if (additional === 26) {
    const view = new DataView(data.buffer, data.byteOffset + offset, 4);
    return { length: view.getUint32(0), offset: offset + 4 };
  }
  if (additional === 27) {
    const view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const value = view.getBigUint64(0);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("CBOR maior que o suportado.");
    return { length: Number(value), offset: offset + 8 };
  }
  throw new Error("CBOR com tamanho indefinido não suportado.");
}

function decodeCbor(data: Uint8Array, startOffset = 0): CborResult {
  if (startOffset >= data.length) throw new Error("CBOR incompleto.");
  const initial = data[startOffset];
  const major = initial >> 5;
  const additional = initial & 0x1f;
  let offset = startOffset + 1;
  const lengthInfo = readLength(data, offset, additional);
  const length = lengthInfo.length;
  offset = lengthInfo.offset;

  if (major === 0) return { value: length, nextOffset: offset };
  if (major === 1) return { value: -1 - length, nextOffset: offset };
  if (major === 2) {
    const end = offset + length;
    if (end > data.length) throw new Error("CBOR bytes incompletos.");
    return { value: data.slice(offset, end), nextOffset: end };
  }
  if (major === 3) {
    const end = offset + length;
    if (end > data.length) throw new Error("CBOR texto incompleto.");
    return { value: new TextDecoder().decode(data.slice(offset, end)), nextOffset: end };
  }
  if (major === 4) {
    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const item = decodeCbor(data, offset);
      values.push(item.value);
      offset = item.nextOffset;
    }
    return { value: values, nextOffset: offset };
  }
  if (major === 5) {
    const map = new Map<unknown, unknown>();
    for (let index = 0; index < length; index += 1) {
      const key = decodeCbor(data, offset);
      offset = key.nextOffset;
      const value = decodeCbor(data, offset);
      offset = value.nextOffset;
      map.set(key.value, value.value);
    }
    return { value: map, nextOffset: offset };
  }
  if (major === 6) {
    const tagged = decodeCbor(data, offset);
    return { value: tagged.value, nextOffset: tagged.nextOffset };
  }
  if (major === 7) {
    if (additional === 20) return { value: false, nextOffset: offset };
    if (additional === 21) return { value: true, nextOffset: offset };
    if (additional === 22 || additional === 23) return { value: null, nextOffset: offset };
  }
  throw new Error("Tipo CBOR não suportado.");
}

function sha256(input: Uint8Array | string) {
  return createHash("sha256").update(input).digest();
}

function parseAuthenticatorData(authData: Uint8Array, requireAttestedCredential: boolean) {
  if (authData.length < 37) throw new Error("Dados do autenticador inválidos.");
  const rpIdHash = authData.slice(0, 32);
  const flags = authData[32];
  const counter = new DataView(authData.buffer, authData.byteOffset + 33, 4).getUint32(0);
  if ((flags & 0x01) === 0) throw new Error("Presença do usuário não confirmada.");
  if ((flags & 0x04) === 0) throw new Error("Biometria/PIN do dispositivo não foi validada.");

  if (!requireAttestedCredential) return { rpIdHash, flags, counter };
  if ((flags & 0x40) === 0) throw new Error("Credencial cadastrada não encontrada nos dados do autenticador.");

  let offset = 37 + 16;
  if (offset + 2 > authData.length) throw new Error("Dados de credencial incompletos.");
  const credentialIdLength = new DataView(authData.buffer, authData.byteOffset + offset, 2).getUint16(0);
  offset += 2;
  const credentialIdEnd = offset + credentialIdLength;
  if (credentialIdEnd > authData.length) throw new Error("ID de credencial inválido.");
  const credentialId = authData.slice(offset, credentialIdEnd);
  const publicKeyStart = credentialIdEnd;
  const publicKeyDecoded = decodeCbor(authData, publicKeyStart);
  if (!(publicKeyDecoded.value instanceof Map)) throw new Error("Chave pública inválida.");
  const publicKeyCose = authData.slice(publicKeyStart, publicKeyDecoded.nextOffset);
  const algorithm = Number(publicKeyDecoded.value.get(3));
  if (![-7, -257, -8].includes(algorithm)) throw new Error("Algoritmo de credencial não suportado.");

  return { rpIdHash, flags, counter, credentialId, publicKeyCose, algorithm };
}

function assertRpIdHash(actual: Uint8Array, rpID: string) {
  const expected = sha256(rpID);
  if (expected.length !== actual.length || !timingSafeEqual(expected, Buffer.from(actual))) {
    throw new Error("A credencial não pertence a este domínio.");
  }
}

function parseClientData(encoded: unknown, expectedType: "webauthn.create" | "webauthn.get", expectedChallenge: string, expectedOrigin: string) {
  if (typeof encoded !== "string") throw new Error("Resposta biométrica inválida.");
  const bytes = base64UrlDecode(encoded);
  let clientData: JsonMap;
  try {
    clientData = JSON.parse(new TextDecoder().decode(bytes)) as JsonMap;
  } catch {
    throw new Error("clientDataJSON inválido.");
  }
  if (clientData.type !== expectedType) throw new Error("Tipo WebAuthn inesperado.");
  if (clientData.challenge !== expectedChallenge) throw new Error("Desafio biométrico expirado ou inválido.");
  if (clientData.origin !== expectedOrigin) throw new Error("Origem da validação biométrica não confere.");
  return bytes;
}

function coseToJwk(coseBytes: Uint8Array) {
  const decoded = decodeCbor(coseBytes).value;
  if (!(decoded instanceof Map)) throw new Error("Chave COSE inválida.");
  const kty = Number(decoded.get(1));
  const alg = Number(decoded.get(3));

  if (kty === 2 && alg === -7) {
    const crv = Number(decoded.get(-1));
    const x = decoded.get(-2);
    const y = decoded.get(-3);
    if (crv !== 1 || !(x instanceof Uint8Array) || !(y instanceof Uint8Array)) throw new Error("Chave EC inválida.");
    return {
      alg,
      jwk: { kty: "EC", crv: "P-256", x: base64UrlEncode(x), y: base64UrlEncode(y), ext: true }
    };
  }

  if (kty === 3 && alg === -257) {
    const n = decoded.get(-1);
    const e = decoded.get(-2);
    if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array)) throw new Error("Chave RSA inválida.");
    return {
      alg,
      jwk: { kty: "RSA", n: base64UrlEncode(n), e: base64UrlEncode(e), alg: "RS256", ext: true }
    };
  }

  if (kty === 1 && alg === -8) {
    const crv = Number(decoded.get(-1));
    const x = decoded.get(-2);
    if (crv !== 6 || !(x instanceof Uint8Array)) throw new Error("Chave Ed25519 inválida.");
    return {
      alg,
      jwk: { kty: "OKP", crv: "Ed25519", x: base64UrlEncode(x), ext: true }
    };
  }

  throw new Error("Tipo de chave pública não suportado.");
}

function derEcdsaToRaw(signature: Uint8Array, size = 32) {
  if (signature.length === size * 2) return signature;
  if (signature[0] !== 0x30) throw new Error("Assinatura ECDSA inválida.");
  let offset = 1;
  let sequenceLength = signature[offset++];
  if ((sequenceLength & 0x80) !== 0) {
    const bytesCount = sequenceLength & 0x7f;
    sequenceLength = 0;
    for (let i = 0; i < bytesCount; i += 1) sequenceLength = (sequenceLength << 8) | signature[offset++];
  }
  if (offset + sequenceLength > signature.length) throw new Error("Assinatura ECDSA truncada.");

  const readInteger = () => {
    if (signature[offset++] !== 0x02) throw new Error("Assinatura ECDSA inválida.");
    let length = signature[offset++];
    if ((length & 0x80) !== 0) {
      const bytesCount = length & 0x7f;
      length = 0;
      for (let i = 0; i < bytesCount; i += 1) length = (length << 8) | signature[offset++];
    }
    let value = signature.slice(offset, offset + length);
    offset += length;
    while (value.length > size && value[0] === 0) value = value.slice(1);
    if (value.length > size) throw new Error("Inteiro ECDSA maior que o esperado.");
    const padded = new Uint8Array(size);
    padded.set(value, size - value.length);
    return padded;
  };

  const r = readInteger();
  const s = readInteger();
  const raw = new Uint8Array(size * 2);
  raw.set(r, 0);
  raw.set(s, size);
  return raw;
}

async function verifyCredentialSignature(publicKeyCose: Uint8Array, signature: Uint8Array, signedData: Uint8Array) {
  const { alg, jwk } = coseToJwk(publicKeyCose);
  const subtle = webcrypto.subtle;

  if (alg === -7) {
    const key = await subtle.importKey("jwk", jwk as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, derEcdsaToRaw(signature), signedData);
  }

  if (alg === -257) {
    const key = await subtle.importKey("jwk", jwk as JsonWebKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, signature, signedData);
  }

  if (alg === -8) {
    const key = await subtle.importKey("jwk", jwk as JsonWebKey, { name: "Ed25519" }, false, ["verify"]);
    return subtle.verify({ name: "Ed25519" }, key, signature, signedData);
  }

  return false;
}

function concatBytes(...arrays: Uint8Array[]) {
  const total = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((array) => {
    result.set(array, offset);
    offset += array.length;
  });
  return result;
}

function cleanTransports(value: unknown) {
  const allowed = new Set(["ble", "cable", "hybrid", "internal", "nfc", "smart-card", "usb"]);
  return Array.isArray(value)
    ? value.filter((transport): transport is string => typeof transport === "string" && allowed.has(transport))
    : [];
}

function cleanLabel(value: unknown) {
  const label = typeof value === "string" ? value.trim().slice(0, 80) : "";
  return label || "Dispositivo biométrico";
}

function cleanProtectedRoutes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((route): route is string => typeof route === "string" && ALLOWED_ROUTES.has(route))));
}

function safeCredentialMeta(credential: StoredCredential) {
  return {
    credentialId: credential.credential_id,
    label: credential.label,
    transports: credential.transports || [],
    deviceType: credential.device_type,
    backedUp: Boolean(credential.backed_up),
    createdAt: credential.created_at,
    lastUsedAt: credential.last_used_at
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "status";

    if (action !== "status") return NextResponse.json({ error: "Ação inválida." }, { status: 400 });

    const [settings, credentials] = await Promise.all([getSettings(), listCredentials()]);
    return NextResponse.json({
      protectedRoutes: settings.protectedRoutes,
      credentials: credentials.map(safeCredentialMeta),
      managementAuthorized: hasManagementAuthorization(request),
      biometricAvailable: credentials.length > 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar segurança." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const protectedRoutes = cleanProtectedRoutes(body.protectedRoutes);
    const credentials = await listCredentials();

    if (credentials.length > 0 && !hasManagementAuthorization(request)) {
      return NextResponse.json({ error: "Valide sua biometria para alterar as áreas protegidas.", requiresBiometric: true }, { status: 403 });
    }
    if (protectedRoutes.length > 0 && credentials.length === 0) {
      return NextResponse.json({ error: "Cadastre uma biometria antes de ativar a proteção de abas." }, { status: 409 });
    }

    const response = await supabaseFetch(`${SETTINGS_TABLE}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: SETTINGS_ID, protected_routes: protectedRoutes, updated_at: new Date().toISOString() })
    });
    if (!response.ok) throw new Error("Não foi possível salvar as configurações de segurança.");

    return NextResponse.json({ ok: true, protectedRoutes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar segurança." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "";
    const body = (await request.json().catch(() => ({}))) as JsonMap;
    const { origin, rpID, rpName } = getRpConfig(request);

    if (action === "register-options") {
      const credentials = await listCredentials();
      if (credentials.length > 0 && !hasManagementAuthorization(request)) {
        return NextResponse.json({ error: "Valide sua biometria antes de cadastrar outro dispositivo.", requiresBiometric: true }, { status: 403 });
      }

      const challenge = base64UrlEncode(randomBytes(32));
      const userName = process.env.VOLT_ADMIN_USER?.trim() || "volt-admin";
      const userId = base64UrlEncode(createHash("sha256").update(`volt:${userName.toLowerCase()}`).digest().subarray(0, 32));
      const options = {
        challenge,
        rp: { name: rpName, id: rpID },
        user: { id: userId, name: userName, displayName: userName },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
          { type: "public-key", alg: -8 }
        ],
        timeout: 60_000,
        attestation: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "required"
        },
        excludeCredentials: credentials.map((credential) => ({
          id: credential.credential_id,
          type: "public-key",
          transports: credential.transports || undefined
        }))
      };
      const response = NextResponse.json({ options, label: cleanLabel(body.label) });
      setChallengeCookie(response, createChallengeCookie("register", challenge, "register"));
      return response;
    }

    if (action === "register-verify") {
      const challengeCookie = readChallengeCookie(request);
      if (!challengeCookie || challengeCookie.kind !== "register") {
        return NextResponse.json({ error: "Cadastro expirado. Inicie a biometria novamente." }, { status: 400 });
      }

      const credential = body.credential as JsonMap | undefined;
      const credentialResponse = credential?.response as JsonMap | undefined;
      if (!credential || !credentialResponse || typeof credential.id !== "string") {
        return NextResponse.json({ error: "Resposta de cadastro biométrico inválida." }, { status: 400 });
      }

      parseClientData(credentialResponse.clientDataJSON, "webauthn.create", challengeCookie.challenge, origin);
      if (typeof credentialResponse.attestationObject !== "string") throw new Error("Attestation WebAuthn ausente.");
      const attestationObject = base64UrlDecode(credentialResponse.attestationObject);
      const decoded = decodeCbor(attestationObject).value;
      if (!(decoded instanceof Map)) throw new Error("Attestation WebAuthn inválida.");
      const fmt = decoded.get("fmt");
      const authData = decoded.get("authData");
      if (fmt !== "none") throw new Error("O autenticador retornou um formato de atestado inesperado.");
      if (!(authData instanceof Uint8Array)) throw new Error("Dados do autenticador ausentes.");
      const parsed = parseAuthenticatorData(authData, true);
      assertRpIdHash(parsed.rpIdHash, rpID);
      if (!parsed.credentialId || !parsed.publicKeyCose || typeof parsed.algorithm !== "number") throw new Error("Credencial biométrica incompleta.");
      const credentialId = base64UrlEncode(parsed.credentialId);
      if (credentialId !== credential.id) throw new Error("ID da credencial não confere.");

      const now = new Date().toISOString();
      const transports = cleanTransports(credentialResponse.transports);
      const save = await supabaseFetch(`${CREDENTIALS_TABLE}?on_conflict=credential_id`, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          credential_id: credentialId,
          label: cleanLabel(body.label),
          public_key: base64UrlEncode(parsed.publicKeyCose),
          algorithm: parsed.algorithm,
          counter: parsed.counter,
          transports,
          device_type: transports.includes("internal") ? "platform" : "passkey",
          backed_up: false,
          created_at: now,
          last_used_at: now
        })
      });
      if (!save.ok) throw new Error("Não foi possível salvar a biometria no Supabase.");

      const response = NextResponse.json({ ok: true, verified: true, credentialId });
      clearChallengeCookie(response);
      setBiometricCookie(response, MANAGEMENT_SCOPE, credentialId);
      return response;
    }

    if (action === "auth-options") {
      const scope = typeof body.scope === "string" ? body.scope : "";
      if (scope !== MANAGEMENT_SCOPE && !ALLOWED_ROUTES.has(scope)) {
        return NextResponse.json({ error: "Área biométrica inválida." }, { status: 400 });
      }
      if (scope !== MANAGEMENT_SCOPE) {
        const settings = await getSettings();
        if (!settings.protectedRoutes.includes(scope)) {
          return NextResponse.json({ error: "Esta área não está configurada para exigir biometria." }, { status: 409 });
        }
      }

      const credentials = await listCredentials();
      if (!credentials.length) {
        return NextResponse.json({ error: "Nenhuma biometria autorizada foi cadastrada." }, { status: 403 });
      }

      const challenge = base64UrlEncode(randomBytes(32));
      const options = {
        challenge,
        rpId: rpID,
        timeout: 60_000,
        userVerification: "required",
        allowCredentials: credentials.map((credential) => ({
          id: credential.credential_id,
          type: "public-key",
          transports: credential.transports || undefined
        }))
      };
      const response = NextResponse.json({ options });
      setChallengeCookie(response, createChallengeCookie("auth", challenge, scope));
      return response;
    }

    if (action === "auth-verify") {
      const challengeCookie = readChallengeCookie(request);
      if (!challengeCookie || challengeCookie.kind !== "auth") {
        return NextResponse.json({ error: "Validação expirada. Tente novamente." }, { status: 400 });
      }
      const credential = body.credential as JsonMap | undefined;
      const credentialResponse = credential?.response as JsonMap | undefined;
      if (!credential || !credentialResponse || typeof credential.id !== "string") {
        return NextResponse.json({ error: "Resposta biométrica inválida." }, { status: 400 });
      }

      const stored = await getCredential(credential.id);
      if (!stored) {
        return NextResponse.json({ error: "Não foi possível validar: biometria ou dispositivo não autorizado." }, { status: 403 });
      }

      const clientDataBytes = parseClientData(credentialResponse.clientDataJSON, "webauthn.get", challengeCookie.challenge, origin);
      if (typeof credentialResponse.authenticatorData !== "string" || typeof credentialResponse.signature !== "string") {
        throw new Error("Resposta do autenticador incompleta.");
      }
      const authenticatorData = base64UrlDecode(credentialResponse.authenticatorData);
      const parsed = parseAuthenticatorData(authenticatorData, false);
      assertRpIdHash(parsed.rpIdHash, rpID);

      const clientDataHash = new Uint8Array(sha256(clientDataBytes));
      const signedData = concatBytes(authenticatorData, clientDataHash);
      const signature = base64UrlDecode(credentialResponse.signature);
      const publicKey = base64UrlDecode(stored.public_key);
      const verified = await verifyCredentialSignature(publicKey, signature, signedData);
      if (!verified) {
        return NextResponse.json({ error: "Não foi possível validar: biometria ou dispositivo não autorizado." }, { status: 403 });
      }

      const previousCounter = Number(stored.counter || 0);
      if (previousCounter > 0 && parsed.counter > 0 && parsed.counter <= previousCounter) {
        return NextResponse.json({ error: "A credencial apresentou um contador de segurança inválido." }, { status: 403 });
      }

      const update = await supabaseFetch(`${CREDENTIALS_TABLE}?credential_id=eq.${encodeURIComponent(stored.credential_id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ counter: parsed.counter, last_used_at: new Date().toISOString() })
      });
      if (!update.ok) throw new Error("Falha ao atualizar o registro de validação.");

      const response = NextResponse.json({ ok: true, verified: true, scope: challengeCookie.scope });
      clearChallengeCookie(response);
      setBiometricCookie(response, challengeCookie.scope, stored.credential_id);
      return response;
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro na validação biométrica." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const credentialId = url.searchParams.get("credentialId")?.trim() || "";
    if (!credentialId) return NextResponse.json({ error: "Credencial não informada." }, { status: 400 });

    const [settings, credentials] = await Promise.all([getSettings(), listCredentials()]);
    if (credentials.length > 0 && !hasManagementAuthorization(request)) {
      return NextResponse.json({ error: "Valide sua biometria para remover um dispositivo.", requiresBiometric: true }, { status: 403 });
    }
    if (settings.protectedRoutes.length > 0 && credentials.length <= 1) {
      return NextResponse.json(
        { error: "Não é possível remover a última biometria enquanto existirem abas protegidas." },
        { status: 409 }
      );
    }

    const response = await supabaseFetch(`${CREDENTIALS_TABLE}?credential_id=eq.${encodeURIComponent(credentialId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
    if (!response.ok) throw new Error("Não foi possível remover a biometria.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao remover biometria." },
      { status: 500 }
    );
  }
}
