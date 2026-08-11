export type BusinessDocumentType = "quote" | "contract" | "company_profile";

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function loadBusinessDocumentsState<T>(type: BusinessDocumentType): Promise<{ documents: T[]; deletedIds: string[] }> {
  const response = await fetch(`/api/business-documents?type=${encodeURIComponent(type)}`, {
    cache: "no-store"
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Erro ao carregar dados do Supabase.");
  }

  return {
    documents: Array.isArray(data.documents) ? data.documents as T[] : [],
    deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds.filter((item): item is string => typeof item === "string") : []
  };
}

export async function loadBusinessDocuments<T>(type: BusinessDocumentType): Promise<T[]> {
  const state = await loadBusinessDocumentsState<T>(type);
  return state.documents;
}

export async function saveBusinessDocuments<T extends { id: string }>(type: BusinessDocumentType, documents: T[]) {
  const response = await fetch(`/api/business-documents?type=${encodeURIComponent(type)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, documents })
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Erro ao salvar dados no Supabase.");
  }

  return data;
}

export async function deleteBusinessDocument(type: BusinessDocumentType, id: string) {
  const response = await fetch(
    `/api/business-documents?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Erro ao excluir dado no Supabase.");
  }
}

export function mergeCloudWithLocal<T extends { id: string }>(cloud: T[], local: T[]) {
  const cloudIds = new Set(cloud.map((item) => item.id));
  const localOnly = local.filter((item) => item?.id && !cloudIds.has(item.id));
  return {
    merged: [...cloud, ...localOnly],
    localOnly
  };
}
