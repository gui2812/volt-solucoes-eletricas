"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";

export type FieldValue = string | number | boolean | string[];
export type CrudRecord = { id: string; [key: string]: FieldValue };

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "textarea"
  | "tags"
  | "checkbox";

export type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  full?: boolean;
};

export type TableColumn = {
  name: string;
  label: string;
  type?: FieldType;
};

export type StatisticConfig<T extends CrudRecord> = {
  label: string;
  value: (items: T[]) => string | number;
  note?: string;
  tone?: "yellow" | "green" | "red" | "blue" | "zinc";
};

export type FunctionalCrudProps<T extends CrudRecord> = {
  title: string;
  subtitle: string;
  storageKey: string;
  idPrefix: string;
  seedData: T[];
  fields: FieldConfig[];
  tableColumns: TableColumn[];
  statistics?: StatisticConfig<T>[];
  statusField?: string;
  typeField?: string;
  valueField?: string;
  dateField?: string;
  children?: ReactNode;
};

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function asNumber(value: FieldValue | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(",", ".")) || 0;
  return 0;
}

function fieldDefault(field: FieldConfig): FieldValue {
  if (field.type === "number" || field.type === "currency") return 0;
  if (field.type === "checkbox") return false;
  if (field.type === "tags") return [];
  if (field.type === "date") return today();
  if (field.type === "select") return field.options?.[0] ?? "";
  return "";
}

function formatValue(value: FieldValue | undefined, type?: FieldType) {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "currency") return money(asNumber(value));
  if (type === "number") return String(value);
  if (type === "checkbox") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function badgeTone(value: string) {
  const text = value.toLowerCase();

  if (["recebido", "pago", "finalizada", "concluído", "ativo", "em estoque", "gerado", "aprovada", "convertida"].some((item) => text.includes(item))) {
    return "bg-volt-ok/15 text-volt-ok border-volt-ok/20";
  }

  if (["vencido", "atrasado", "urgente", "cancelada", "recusada", "sem estoque", "bloqueado", "erro", "inadimplente"].some((item) => text.includes(item))) {
    return "bg-red-500/15 text-red-300 border-red-500/20";
  }

  if (["aberto", "agendada", "enviada", "lead", "rascunho", "em compra"].some((item) => text.includes(item))) {
    return "bg-blue-500/15 text-blue-300 border-blue-500/20";
  }

  return "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25";
}

function statTone(tone?: StatisticConfig<CrudRecord>["tone"]) {
  if (tone === "green") return "text-volt-ok";
  if (tone === "red") return "text-red-300";
  if (tone === "blue") return "text-blue-300";
  if (tone === "zinc") return "text-zinc-300";
  return "text-volt-yellow";
}

export function FunctionalCrud<T extends CrudRecord>({
  title,
  subtitle,
  storageKey,
  idPrefix,
  seedData,
  fields,
  tableColumns,
  statistics = [],
  statusField,
  typeField,
  valueField,
  dateField,
  children
}: FunctionalCrudProps<T>) {
  const [items, setItems] = useState<T[]>(seedData);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CrudRecord>(() => createBlankRecord());

  function createBlankRecord(): CrudRecord {
    const blank: CrudRecord = { id: generateId(seedData.length + 1) };
    fields.forEach((field) => {
      blank[field.name] = fieldDefault(field);
    });
    return blank;
  }

  function generateId(offset = 1) {
    const next = items.length + offset;
    return `${idPrefix}-${String(next).padStart(3, "0")}`;
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      setItems(seedData);
    } finally {
      setReady(true);
    }
  }, [seedData, storageKey]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, ready, storageKey]);

  const statusOptions = useMemo(() => {
    if (!statusField) return [];
    return ["Todos", ...Array.from(new Set(items.map((item) => String(item[statusField] ?? "")).filter(Boolean)))];
  }, [items, statusField]);

  const typeOptions = useMemo(() => {
    if (!typeField) return [];
    return ["Todos", ...Array.from(new Set(items.map((item) => String(item[typeField] ?? "")).filter(Boolean)))];
  }, [items, typeField]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const text = Object.values(item).flat().join(" ").toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = !statusField || statusFilter === "Todos" || String(item[statusField]) === statusFilter;
      const matchesType = !typeField || typeFilter === "Todos" || String(item[typeField]) === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, search, statusField, statusFilter, typeField, typeFilter]);

  const totalValue = useMemo(() => {
    if (!valueField) return 0;
    return filtered.reduce((sum, item) => sum + asNumber(item[valueField]), 0);
  }, [filtered, valueField]);

  function openNew() {
    setEditingId(null);
    const blank = createBlankRecord();
    blank.id = generateId(1);
    setForm(blank);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditingId(item.id);
    setForm({ ...item });
    setModalOpen(true);
  }

  function setField(field: FieldConfig, raw: string | boolean) {
    let value: FieldValue;

    if (field.type === "number" || field.type === "currency") {
      value = raw === "" ? 0 : Number(String(raw).replace(",", ".")) || 0;
    } else if (field.type === "checkbox") {
      value = Boolean(raw);
    } else if (field.type === "tags") {
      value = String(raw)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      value = String(raw);
    }

    setForm((current) => ({ ...current, [field.name]: value }));
  }

  function validate() {
    const missing = fields.find((field) => field.required && !form[field.name]);
    if (missing) {
      alert(`Preencha o campo: ${missing.label}`);
      return false;
    }
    return true;
  }

  function save() {
    if (!validate()) return;

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? ({ ...item, ...form } as T) : item)));
    } else {
      const record = { ...form, id: form.id || generateId(1) } as T;
      setItems((current) => [record, ...current]);
    }

    setModalOpen(false);
    setEditingId(null);
  }

  function remove(id: string) {
    const ok = window.confirm("Tem certeza que deseja excluir este registro?");
    if (!ok) return;
    setItems((current) => current.filter((item) => item.id !== id));
    setModalOpen(false);
    setEditingId(null);
  }

  function duplicate(item: T) {
    const copy = { ...item, id: generateId(1) } as T;
    setItems((current) => [copy, ...current]);
  }

  function resetSamples() {
    const ok = window.confirm("Isso vai apagar as alterações salvas neste módulo e restaurar os exemplos. Continuar?");
    if (!ok) return;
    localStorage.removeItem(storageKey);
    setItems(seedData);
  }

  function exportCsv() {
    const headers = tableColumns.map((column) => column.label);
    const rows = filtered.map((item) => tableColumns.map((column) => formatValue(item[column.name], column.type)));
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${storageKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />

        <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Módulo funcional</p>
            <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{subtitle}</p>
            <p className="mt-2 text-xs font-bold text-zinc-600">
              Dados salvos no navegador via localStorage. Depois essa mesma estrutura pode ser ligada ao Supabase.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
            <button onClick={openNew} className="btn-primary inline-flex items-center justify-center gap-2">
              <Plus size={17} /> Adicionar
            </button>
            <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2">
              <Download size={17} /> Exportar CSV
            </button>
            <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2">
              <FileText size={17} /> PDF
            </button>
            <button onClick={resetSamples} className="btn-ghost inline-flex items-center justify-center gap-2">
              <RotateCcw size={17} /> Restaurar
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.7fr_.7fr]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
            <Search size={17} className="text-volt-yellow" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por qualquer informação..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
          </div>

          {statusField ? (
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none"
            >
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          ) : <div />}

          {typeField ? (
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none"
            >
              {typeOptions.map((type) => <option key={type}>{type}</option>)}
            </select>
          ) : <div />}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <article className="card-premium rounded-3xl p-4">
          <p className="text-sm text-zinc-500">Registros</p>
          <p className="mt-2 text-2xl font-black text-volt-yellow">{filtered.length}</p>
          <p className="mt-1 text-xs text-zinc-600">Filtrados na tela</p>
        </article>

        {valueField && (
          <article className="card-premium rounded-3xl p-4">
            <p className="text-sm text-zinc-500">Valor total</p>
            <p className="mt-2 text-2xl font-black text-volt-yellow">{money(totalValue)}</p>
            <p className="mt-1 text-xs text-zinc-600">Campo: {valueField}</p>
          </article>
        )}

        {statistics.map((stat) => (
          <article key={stat.label} className="card-premium rounded-3xl p-4">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className={classNames("mt-2 text-2xl font-black", statTone(stat.tone))}>{stat.value(filtered)}</p>
            {stat.note && <p className="mt-1 text-xs text-zinc-600">{stat.note}</p>}
          </article>
        ))}
      </section>

      {children}

      <section className="card-premium rounded-[2rem] p-5 md:p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Tabela editável</p>
            <h2 className="mt-1 text-2xl font-black">{title}</h2>
          </div>
          <button onClick={openNew} className="btn-primary inline-flex items-center justify-center gap-2">
            <Plus size={17} /> Novo registro
          </button>
        </div>

        <div className="volt-scroll overflow-x-auto">
          <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                {tableColumns.map((column) => (
                  <th key={column.name} className="px-4 py-2">{column.label}</th>
                ))}
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="bg-white/[.035] text-sm">
                  {tableColumns.map((column, index) => {
                    const value = formatValue(item[column.name], column.type);
                    const isStatus = column.name === statusField || column.name === typeField;

                    return (
                      <td key={column.name} className={classNames("px-4 py-4", index === 0 && "rounded-l-2xl")}>
                        {isStatus ? (
                          <span className={classNames("inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em]", badgeTone(value))}>
                            {value}
                          </span>
                        ) : column.type === "currency" ? (
                          <span className="font-black text-volt-yellow">{value}</span>
                        ) : (
                          <span className={index === 0 ? "font-black" : "text-zinc-300"}>{value}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-volt-yellow hover:bg-volt-yellow hover:text-black"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => duplicate(item)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-300 hover:border-volt-yellow/30 hover:text-volt-yellow"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-red-300 hover:border-red-400/30 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={tableColumns.length + 1} className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-10 text-center text-sm text-zinc-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="volt-scroll max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
                  {editingId ? "Editar registro" : "Novo registro"}
                </p>
                <h2 className="mt-2 text-3xl font-black">{String(form.id)}</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Preencha os campos e clique em salvar. Agora a alteração fica gravada no navegador.
                </p>
              </div>

              <button onClick={() => setModalOpen(false)} className="btn-ghost inline-flex items-center gap-2">
                <X size={17} /> Fechar
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <label className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">ID</label>
                <input
                  value={String(form.id)}
                  onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                />
              </div>

              {fields.map((field) => {
                const value = form[field.name];
                const inputValue = field.type === "tags" && Array.isArray(value) ? value.join(", ") : String(value ?? "");

                return (
                  <div key={field.name} className={classNames("rounded-2xl border border-white/10 bg-white/[.035] p-4", (field.full || field.type === "textarea") && "md:col-span-2")}>
                    <label className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">
                      {field.label}{field.required && <span className="text-red-300"> *</span>}
                    </label>

                    {field.type === "select" ? (
                      <select
                        value={String(value ?? "")}
                        onChange={(event) => setField(field, event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                      >
                        {(field.options ?? []).map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        value={inputValue}
                        onChange={(event) => setField(field, event.target.value)}
                        rows={4}
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                      />
                    ) : field.type === "checkbox" ? (
                      <label className="mt-3 flex items-center gap-3 text-sm font-bold text-zinc-300">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(event) => setField(field, event.target.checked)}
                          className="h-5 w-5 accent-volt-yellow"
                        />
                        Sim / Não
                      </label>
                    ) : (
                      <input
                        value={inputValue}
                        onChange={(event) => setField(field, event.target.value)}
                        type={field.type === "date" ? "date" : field.type === "number" || field.type === "currency" ? "number" : "text"}
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                      />
                    )}

                    {field.type === "tags" && (
                      <p className="mt-2 text-xs text-zinc-600">Separe os itens por vírgula.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
              <div className="flex flex-wrap gap-2">
                {editingId && (
                  <button onClick={() => remove(editingId)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-200">
                    <Trash2 size={17} /> Excluir
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancelar</button>
                <button onClick={save} className="btn-primary inline-flex items-center justify-center gap-2">
                  <Save size={17} /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
