"use client";

import { OrbitControls, Text, Line } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { QdcComponent, QdcWire } from "@/types";
import { useMemo } from "react";

function componentColor(component: QdcComponent) {
  if (component.kind === "neutralBus") return "#38bdf8";
  if (component.kind === "groundBus") return "#22c55e";
  if (component.kind === "phaseBus" || component.kind === "combBus") return "#ef4444";
  if (component.kind === "load") return "#64748b";
  if (component.kind === "dinRail") return "#475569";
  if (component.kind === "duct") return "#334155";
  return component.color || "#f7c400";
}

function BoardCabinet() {
  return (
    <group>
      <mesh position={[0, 0, -0.12]} receiveShadow>
        <boxGeometry args={[11.5, 7.2, 0.24]} />
        <meshStandardMaterial color="#111827" roughness={0.72} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, -0.24]}>
        <boxGeometry args={[12.05, 7.75, 0.2]} />
        <meshStandardMaterial color="#06080c" roughness={0.9} metalness={0.1} />
      </mesh>
      {[-2.4, 0, 2.4].map((y) => (
        <mesh key={y} position={[0, y, 0.02]}>
          <boxGeometry args={[10.6, 0.12, 0.12]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.55} metalness={0.75} />
        </mesh>
      ))}
      <Text position={[0, 3.58, 0.05]} fontSize={0.18} color="#f7c400" anchorX="center">
        VOLT QDC BUILDER 3D
      </Text>
    </group>
  );
}

function ComponentMesh({ component, selected }: { component: QdcComponent; selected: boolean }) {
  const width = Math.max(0.42, component.widthModules * 0.42);
  const height = component.kind === "load" ? 0.62 : component.kind === "dinRail" || component.kind === "duct" ? 0.18 : 1.1;
  const depth = component.kind === "load" ? 0.28 : 0.45;
  const color = componentColor(component);
  return (
    <group position={[component.x, component.y, component.z + 0.18]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.15} emissive={selected ? "#2a2200" : "#000000"} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.012]}>
        <boxGeometry args={[Math.max(0.08, width - 0.12), Math.max(0.05, height - 0.18), 0.025]} />
        <meshStandardMaterial color={component.kind === "load" ? "#111827" : "#0f172a"} roughness={0.6} />
      </mesh>
      <Text position={[0, -height / 2 - 0.17, depth / 2 + 0.05]} fontSize={0.12} color="#f8fafc" anchorX="center" maxWidth={1.25}>
        {component.label}
      </Text>
      {selected && (
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[width + 0.1, height + 0.1, 0.04]} />
          <meshStandardMaterial color="#f7c400" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function WireLine({ wire, components }: { wire: QdcWire; components: QdcComponent[] }) {
  const fromComp = components.find((component) => component.id === wire.from.componentId);
  const toComp = components.find((component) => component.id === wire.to.componentId);
  const fromPoint = fromComp?.connectors.find((connector) => connector.id === wire.from.connectorId);
  const toPoint = toComp?.connectors.find((connector) => connector.id === wire.to.connectorId);
  const points = useMemo(() => {
    if (!fromComp || !toComp || !fromPoint || !toPoint) return [];
    const a: [number, number, number] = [fromComp.x + fromPoint.x, fromComp.y + fromPoint.y, 0.8];
    const b: [number, number, number] = [toComp.x + toPoint.x, toComp.y + toPoint.y, 0.8];
    const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.18, 1.1];
    return [a, mid, b];
  }, [fromComp, toComp, fromPoint, toPoint]);
  if (points.length === 0) return null;
  return <Line points={points} color={wire.color} lineWidth={3} />;
}

export function QdcScene({ components, wires, selectedComponentId }: { components: QdcComponent[]; wires: QdcWire[]; selectedComponentId: string | null }) {
  return (
    <Canvas shadows camera={{ position: [0, -8.5, 7.2], fov: 48 }}>
      <ambientLight intensity={0.65} />
      <directionalLight castShadow position={[2, -4, 7]} intensity={1.35} />
      <pointLight position={[-4, 2, 4]} intensity={0.6} color="#f7c400" />
      <BoardCabinet />
      {components.map((component) => <ComponentMesh key={component.id} component={component} selected={selectedComponentId === component.id} />)}
      {wires.map((wire) => <WireLine key={wire.id} wire={wire} components={components} />)}
      <OrbitControls enableDamping makeDefault maxDistance={16} minDistance={4} />
    </Canvas>
  );
}
