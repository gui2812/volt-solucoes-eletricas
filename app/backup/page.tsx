import { AppShell } from "@/components/layout/app-shell";
import { ModulePage } from "@/components/ui/module-page";

export default function Page() {
  return (
    <AppShell>
      <ModulePage title="Backup" subtitle="Exportação e segurança dos dados locais." storageKey="volt_next_backup" columns={["Nome", "Status", "Valor", "Data"]} />
    </AppShell>
  );
}
