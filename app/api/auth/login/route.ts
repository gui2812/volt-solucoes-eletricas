import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "volt_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function getAuthSecret() {
  return process.env.VOLT_AUTH_SECRET?.trim() || "";
}

function signSession(timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = typeof body.user === "string" ? body.user.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const expectedUser = process.env.VOLT_ADMIN_USER?.trim();
    const expectedPassword = process.env.VOLT_ADMIN_PASSWORD || "";
    const authSecret = getAuthSecret();

    if (!expectedUser || !expectedPassword || !authSecret) {
      return NextResponse.json(
        {
          error: "Login seguro ainda não configurado na Vercel. Configure VOLT_ADMIN_USER, VOLT_ADMIN_PASSWORD e VOLT_AUTH_SECRET."
        },
        { status: 500 }
      );
    }

    const userOk = user.toLowerCase() === expectedUser.toLowerCase();
    const passwordOk = safeCompare(password, expectedPassword);

    if (!userOk || !passwordOk) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const timestamp = Date.now().toString();
    const signature = signSession(timestamp, authSecret);
    const token = `${timestamp}.${signature}`;

    const response = NextResponse.json({
      ok: true
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro ao validar login." },
      { status: 500 }
    );
  }
}
