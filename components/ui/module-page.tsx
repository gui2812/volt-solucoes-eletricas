"use client";

import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "./page-title";
import { Download, Plus, Search, Trash2 } from "lucide-react";

type Item = { id: string; nome: string; status: string; valor?: number; data: string; descricao?: string };

export function ModulePage({ title, subtitle, storageKey, columns }: { title: string; subtitle: string; storageKey: string; columns: string[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("Aberto");
  const [valor, setValor] = useState(0);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setItems(JSON.parse(saved));
  }, [storageKey]);

  function save(next: Item[]) {
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function add() {
    if (!nome.trim()) return;
    save([{ id: crypto.randomUUID(), nome, descricao, status, valor, data: new Date().toLocaleDateString("pt-BR") }, ...items]);
    setNome("");
    setDescricao("");
    setValor(0);
  }

  function exportCsv() {
    const header = "Nome;Descricao;Status;Valor;Data";
    const rows = items.map((item) => [item.nome, item.descricao || "", item.status, item.valor || 0, item.data].join(";"));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storageKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => items.filter((item) => `${item.nome} ${item.status} ${item.descricao}`.toLowerCase().includes(filter.toLowerCase())), [items, filter]);
  const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const open = items.filter((item) => item.status !== "Finalizado" && item.status !== "Pago").length;

  return (
    <>
      <PageTitle title={title} subtitle={subtitle} />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="card-premium rounded-[2rem] p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <input className="input-dark pl-11" placeholder="Buscar registros..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <button className="btn-ghost inline-flex items-center justify-center gap-2" onClick={exportCsv}><Download size={17} /> Exportar CSV</button>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-5">
            <input className="input-dark lg:col-span-2" placeholder="Nome / cliente / serviço" value={nome} onChange={(e) => setNome(e.target.value)} />
            <select className="input-dark" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Aberto</option><option>Em andamento</option><option>Agendado</option><option>Finalizado</option><option>Pago</option><option>Pendente</option>
            </select>
            <input className="input-dark" type="number" placeholder="Valor" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
            <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={add}><Plus size={17} /> Adicionar</button>
            <textarea className="input-dark lg:col-span-5" placeholder="Observação / descrição técnica" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>

          <div className="volt-scroll overflow-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[.04] text-xs uppercase tracking-[.16em] text-zinc-400"><tr>{columns.map((col) => <th key={col} className="px-4 py-3">{col}</th>)}<th className="px-4 py-3">Ações</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td className="px-4 py-8 text-center text-zinc-500" colSpan={columns.length + 1}>Nenhum registro ainda.</td></tr>}
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-white/10 align-top hover:bg-white/[.025]">
                    <td className="px-4 py-3"><p className="font-black">{item.nome}</p><p className="mt-1 max-w-md text-xs leading-5 text-zinc-500">{item.descricao}</p></td>
                    <td className="px-4 py-3"><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-black">{item.status}</span></td>
                    <td className="px-4 py-3 font-black text-volt-yellow">R$ {Number(item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.data}</td>
                    <td className="px-4 py-3"><button className="inline-flex items-center gap-1 text-red-300" onClick={() => save(items.filter((x) => x.id !== item.id))}><Trash2 size={15} /> Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card-premium rounded-[2rem] p-5">
            <p className="text-sm text-zinc-400">Resumo do módulo</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4"><p className="text-3xl font-black">{items.length}</p><p className="text-xs text-zinc-500">registros</p></div>
              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4"><p className="text-3xl font-black">{open}</p><p className="text-xs text-zinc-500">em aberto</p></div>
            </div>
            <div className="mt-4 rounded-3xl border border-volt-yellow/20 bg-volt-yellow/10 p-4"><p className="text-sm text-zinc-300">Total financeiro</p><p className="mt-1 text-3xl font-black text-volt-yellow">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
          </div>
          <div className="card-premium rounded-[2rem] p-5">
            <p className="font-black">Próximas melhorias</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Este módulo já salva no navegador. Depois conectamos no Supabase para login real, banco online, anexos, fotos, clientes e relatórios profissionais.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
