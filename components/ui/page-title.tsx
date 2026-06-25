export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}
