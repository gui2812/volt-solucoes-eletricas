import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "client-documents";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.");
  }

  return {
    url: url.replace(/\/$/, ""),
    key
  };
}

function headers(key: string, extra?: HeadersInit) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra
  };
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function encodePath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function ensureBucket() {
  const config = getSupabaseConfig();

  const check = await fetch(`${config.url}/storage/v1/bucket/${BUCKET}`, {
    headers: headers(config.key)
  });

  if (check.ok) return;

  const create = await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(config.key, {
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 15728640
    })
  });

  if (!create.ok && create.status !== 409) {
    const details = await create.text();
    throw new Error(`Falha ao criar bucket de documentos: ${details}`);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const clientId = String(formData.get("clientId") || "cliente");
    const title = String(formData.get("title") || "documento");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    await ensureBucket();

    const config = getSupabaseConfig();
    const safeClient = slug(clientId) || "cliente";
    const safeName = slug(file.name) || "documento";
    const path = `${safeClient}/${Date.now()}-${safeName}`;
    const encodedPath = encodePath(path);

    const upload = await fetch(`${config.url}/storage/v1/object/${BUCKET}/${encodedPath}`, {
      method: "POST",
      headers: headers(config.key, {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      }),
      body: await file.arrayBuffer()
    });

    if (!upload.ok) {
      const details = await upload.text();
      return NextResponse.json(
        { error: "Falha ao enviar documento para o Supabase Storage.", details },
        { status: upload.status }
      );
    }

    const url = `${config.url}/storage/v1/object/public/${BUCKET}/${encodedPath}`;

    return NextResponse.json({
      title,
      url,
      path,
      fileName: file.name,
      mimeType: file.type
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar documento." },
      { status: 500 }
    );
  }
}
