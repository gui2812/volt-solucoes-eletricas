import type { QdcComponent, QdcWire, ValidationAlert, WireKind } from "@/types";

export function calculateCurrent(powerW?: number, voltage?: number) {
  if (!powerW || !voltage) return 0;
  return Number((powerW / voltage).toFixed(2));
}

export function suggestBreaker(currentA: number) {
  const values = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100];
  return values.find((value) => value >= currentA * 1.15) ?? values[values.length - 1];
}

export function suggestCable(currentA: number) {
  if (currentA <= 10) return 1.5;
  if (currentA <= 20) return 2.5;
  if (currentA <= 25) return 4;
  if (currentA <= 40) return 6;
  if (currentA <= 50) return 10;
  if (currentA <= 63) return 16;
  return 25;
}

export function defaultWireColor(kind: WireKind) {
  const colors: Record<WireKind, string> = {
    fase: "#ef4444",
    neutro: "#38bdf8",
    terra: "#22c55e",
    retorno: "#f8fafc"
  };
  return colors[kind];
}

function endpointComponent(wire: QdcWire, components: QdcComponent[]) {
  return {
    from: components.find((component) => component.id === wire.from.componentId),
    to: components.find((component) => component.id === wire.to.componentId)
  };
}

function touchesKind(wire: QdcWire, components: QdcComponent[], kind: QdcComponent["kind"]) {
  const { from, to } = endpointComponent(wire, components);
  return from?.kind === kind || to?.kind === kind;
}

export function validateQdcProject(components: QdcComponent[], wires: QdcWire[]): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];
  const loads = components.filter((component) => component.kind === "load");
  const breakers = components.filter((component) => component.kind.includes("breaker") || component.kind === "mainBreaker");
  const drs = components.filter((component) => component.kind === "dr2" || component.kind === "dr4");
  const dps = components.filter((component) => component.kind === "dps");
  const neutralBus = components.find((component) => component.kind === "neutralBus");
  const groundBus = components.find((component) => component.kind === "groundBus");

  if (!components.length) {
    alerts.push({ id: "empty", level: "Atenção", title: "QDC vazio", description: "Adicione componentes no quadro para iniciar a validação." });
    return alerts;
  }

  if (!neutralBus) alerts.push({ id: "no-neutral", level: "Atenção", title: "Sem barramento de neutro", description: "Adicione um barramento de neutro separado do terra." });
  if (!groundBus) alerts.push({ id: "no-ground", level: "Atenção", title: "Sem barramento de terra", description: "Adicione um barramento de terra/PE para os circuitos." });
  if (!breakers.length) alerts.push({ id: "no-breaker", level: "Erro", title: "Sem disjuntor", description: "O quadro precisa de proteção por disjuntor para alimentar os circuitos." });
  if (!drs.length) alerts.push({ id: "no-dr", level: "Atenção", title: "DR não instalado", description: "Circuitos residenciais geralmente exigem análise de proteção diferencial residual." });

  components.forEach((a) => {
    components.forEach((b) => {
      if (a.id >= b.id) return;
      const overlap = Math.abs(a.x - b.x) < 0.75 && Math.abs(a.y - b.y) < 0.65;
      if (overlap) {
        alerts.push({ id: `overlap-${a.id}-${b.id}`, level: "Erro", title: "Componentes sobrepostos", description: `${a.label} e ${b.label} estão muito próximos ou ocupando o mesmo espaço.`, componentId: a.id });
      }
    });
  });

  wires.forEach((wire) => {
    const { from, to } = endpointComponent(wire, components);
    if (!from || !to) {
      alerts.push({ id: `wire-${wire.id}-missing`, level: "Erro", title: "Fio sem conexão final", description: "Existe um fio apontando para um componente que não existe mais.", wireId: wire.id });
      return;
    }
    if (wire.kind === "neutro" && touchesKind(wire, components, "groundBus")) {
      alerts.push({ id: `wire-${wire.id}-neutral-ground`, level: "Erro", title: "Neutro no terra", description: "Fio de neutro está conectado no barramento de terra.", wireId: wire.id });
    }
    if (wire.kind === "terra" && touchesKind(wire, components, "neutralBus")) {
      alerts.push({ id: `wire-${wire.id}-ground-neutral`, level: "Erro", title: "Terra no neutro", description: "Fio de terra está conectado no barramento de neutro.", wireId: wire.id });
    }
    if (wire.kind === "fase" && touchesKind(wire, components, "neutralBus")) {
      alerts.push({ id: `wire-${wire.id}-phase-neutral`, level: "Erro", title: "Fase no neutro", description: "Fase ligada no barramento de neutro.", wireId: wire.id });
    }
    if (!wire.gaugeMm2) {
      alerts.push({ id: `wire-${wire.id}-gauge`, level: "Atenção", title: "Fio sem bitola", description: "Informe a bitola do cabo para validar melhor o circuito.", wireId: wire.id });
    }
  });

  loads.forEach((load) => {
    const relatedWires = wires.filter((wire) => wire.from.componentId === load.id || wire.to.componentId === load.id);
    const wireKinds = new Set(relatedWires.map((wire) => wire.kind));
    const current = calculateCurrent(load.powerW, load.voltage);
    const cable = load.cableMm2 ?? 0;

    if (!load.label || load.label.trim().length < 3) {
      alerts.push({ id: `load-${load.id}-label`, level: "Atenção", title: "Circuito sem etiqueta", description: "Identifique o circuito para facilitar manutenção e relatório.", componentId: load.id });
    }
    if (!wireKinds.has("fase")) alerts.push({ id: `load-${load.id}-phase`, level: "Erro", title: "Circuito sem fase", description: `${load.label} não possui fase conectada.`, componentId: load.id });
    if (!wireKinds.has("neutro") && load.voltage !== 220) alerts.push({ id: `load-${load.id}-neutral`, level: "Atenção", title: "Circuito sem neutro", description: `${load.label} não possui neutro conectado.`, componentId: load.id });
    if (!wireKinds.has("terra")) alerts.push({ id: `load-${load.id}-ground`, level: "Atenção", title: "Circuito sem terra", description: `${load.label} não possui condutor de proteção conectado.`, componentId: load.id });
    if (!load.powerW) alerts.push({ id: `load-${load.id}-power`, level: "Atenção", title: "Carga sem potência", description: `Informe a potência de ${load.label}.`, componentId: load.id });
    if (current > 0 && cable > 0 && cable < suggestCable(current)) {
      alerts.push({ id: `load-${load.id}-cable`, level: "Erro", title: "Bitola abaixo da sugestão", description: `${load.label}: corrente aproximada ${current} A, sugestão mínima orientativa ${suggestCable(current)} mm².`, componentId: load.id });
    }
  });

  dps.forEach((item) => {
    const hasGround = wires.some((wire) => (wire.from.componentId === item.id || wire.to.componentId === item.id) && wire.kind === "terra");
    if (!hasGround) alerts.push({ id: `dps-${item.id}-ground`, level: "Atenção", title: "DPS sem terra", description: "O DPS foi adicionado, mas ainda não há ligação de terra/PE visível.", componentId: item.id });
  });

  const hasError = alerts.some((alert) => alert.level === "Erro");
  const hasWarn = alerts.some((alert) => alert.level === "Atenção");
  if (!hasError && !hasWarn) {
    alerts.push({ id: "project-ok", level: "OK", title: "Montagem orientativa OK", description: "Não encontramos erros básicos de ligação no modelo atual." });
  }

  return alerts;
}
