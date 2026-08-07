"use client";

import type {
  SignatureBrush,
  SignatureData,
  SignatureInk,
  SignatureMode,
  SignatureStyle
} from "@/types/signatures";
import {
  Check,
  Eraser,
  ImageUp,
  PenLine,
  Redo2,
  RotateCcw,
  Sparkles,
  Type,
  Undo2,
  Upload
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StudioTab = "draw" | "models" | "initials" | "upload" | "typed";

type Point = {
  x: number;
  y: number;
  pressure: number;
};

type Stroke = {
  points: Point[];
  brush: SignatureBrush;
  ink: SignatureInk;
};

type SignatureStyleOption = {
  value: SignatureStyle;
  label: string;
  description: string;
  previewClass: string;
  fontFamily: string;
  weight: number;
  italic: boolean;
  flourish: "classic" | "underline" | "sweep" | "circle" | "minimal" | "monogram";
};

const styles: SignatureStyleOption[] = [
  { value: "Clássica", label: "Clássica", description: "Equilibrada e tradicional", previewClass: "font-serif text-3xl italic", fontFamily: '"Times New Roman", Georgia, serif', weight: 500, italic: true, flourish: "classic" },
  { value: "Elegante", label: "Elegante", description: "Leve, inclinada e refinada", previewClass: "font-serif text-4xl italic tracking-wide", fontFamily: '"URW Chancery L", "Brush Script MT", cursive', weight: 500, italic: true, flourish: "sweep" },
  { value: "Executiva", label: "Executiva", description: "Firme e profissional", previewClass: "font-serif text-3xl font-semibold italic", fontFamily: 'Georgia, "Times New Roman", serif', weight: 650, italic: true, flourish: "underline" },
  { value: "Caligráfica", label: "Caligráfica", description: "Traço fluido de caneta", previewClass: "font-serif text-4xl italic", fontFamily: '"Segoe Script", "Brush Script MT", cursive', weight: 500, italic: true, flourish: "sweep" },
  { value: "Autógrafo", label: "Autógrafo", description: "Marcante e expressiva", previewClass: "font-serif text-4xl font-bold italic -skew-x-6", fontFamily: '"Brush Script MT", "Segoe Script", cursive', weight: 700, italic: true, flourish: "classic" },
  { value: "Traço longo", label: "Traço longo", description: "Final alongado e moderno", previewClass: "font-serif text-3xl italic tracking-wide", fontFamily: '"URW Chancery L", Georgia, serif', weight: 500, italic: true, flourish: "sweep" },
  { value: "Moderna", label: "Moderna", description: "Limpa e contemporânea", previewClass: "font-sans text-2xl font-light italic tracking-[.14em]", fontFamily: 'Arial, Helvetica, sans-serif', weight: 300, italic: true, flourish: "underline" },
  { value: "Minimalista", label: "Minimalista", description: "Discreta e objetiva", previewClass: "font-sans text-2xl font-light italic", fontFamily: 'Arial, Helvetica, sans-serif', weight: 300, italic: true, flourish: "minimal" },
  { value: "Rubrica rápida", label: "Rubrica rápida", description: "Compacta e dinâmica", previewClass: "font-serif text-3xl font-bold italic -skew-x-12", fontFamily: 'Georgia, "Times New Roman", serif', weight: 700, italic: true, flourish: "classic" },
  { value: "Rubrica circular", label: "Rubrica circular", description: "Com contorno de rubrica", previewClass: "font-serif text-3xl font-bold italic", fontFamily: 'Georgia, "Times New Roman", serif', weight: 700, italic: true, flourish: "circle" },
  { value: "Formal", label: "Formal", description: "Sólida e institucional", previewClass: "font-serif text-2xl font-bold tracking-wide", fontFamily: 'Georgia, "Times New Roman", serif', weight: 700, italic: false, flourish: "underline" },
  { value: "Monograma", label: "Monograma", description: "Iniciais em destaque", previewClass: "font-serif text-4xl font-bold italic", fontFamily: 'Georgia, "Times New Roman", serif', weight: 700, italic: true, flourish: "monogram" }
];

const brushWidths: Record<SignatureBrush, number> = {
  "Caneta fina": 1.45,
  "Caneta assinatura": 2.45,
  Caligráfica: 3.65,
  Marcador: 5.4
};

const inkColors: Record<SignatureInk, string> = {
  Preta: "#111827",
  Azul: "#123e8a"
};

const tabs: Array<{ id: StudioTab; label: string; shortLabel: string; icon: typeof PenLine }> = [
  { id: "draw", label: "Desenhar", shortLabel: "Desenhar", icon: PenLine },
  { id: "models", label: "Modelos", shortLabel: "Modelos", icon: Sparkles },
  { id: "initials", label: "Iniciais", shortLabel: "Iniciais", icon: Type },
  { id: "upload", label: "Enviar imagem", shortLabel: "Imagem", icon: ImageUp },
  { id: "typed", label: "Nome + aceite", shortLabel: "Aceite", icon: Check }
];

function tabFromMode(mode?: SignatureMode): StudioTab {
  if (mode === "Rubrica predefinida") return "models";
  if (mode === "Rubrica por iniciais") return "initials";
  if (mode === "Imagem enviada") return "upload";
  if (mode === "Nome digitado + aceite") return "typed";
  return "draw";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("pt-BR");
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase("pt-BR");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function drawFlourish(
  context: CanvasRenderingContext2D,
  flourish: SignatureStyleOption["flourish"],
  width: number,
  height: number,
  color: string
) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 3.2;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalAlpha = 0.92;
  context.beginPath();

  if (flourish === "minimal") {
    context.moveTo(width * 0.34, height * 0.72);
    context.lineTo(width * 0.68, height * 0.72);
  } else if (flourish === "underline") {
    context.moveTo(width * 0.2, height * 0.72);
    context.bezierCurveTo(width * 0.38, height * 0.76, width * 0.64, height * 0.68, width * 0.82, height * 0.7);
  } else if (flourish === "sweep") {
    context.moveTo(width * 0.16, height * 0.75);
    context.bezierCurveTo(width * 0.42, height * 0.86, width * 0.73, height * 0.58, width * 0.9, height * 0.7);
    context.bezierCurveTo(width * 0.82, height * 0.66, width * 0.77, height * 0.78, width * 0.72, height * 0.82);
  } else if (flourish === "circle" || flourish === "monogram") {
    context.ellipse(width * 0.5, height * 0.5, width * 0.29, height * 0.31, -0.16, 0.2, Math.PI * 1.92);
    context.moveTo(width * 0.18, height * 0.73);
    context.bezierCurveTo(width * 0.43, height * 0.8, width * 0.7, height * 0.64, width * 0.86, height * 0.69);
  } else {
    context.moveTo(width * 0.18, height * 0.73);
    context.bezierCurveTo(width * 0.34, height * 0.84, width * 0.57, height * 0.61, width * 0.85, height * 0.7);
    context.moveTo(width * 0.32, height * 0.31);
    context.bezierCurveTo(width * 0.23, height * 0.52, width * 0.29, height * 0.69, width * 0.4, height * 0.79);
  }

  context.stroke();
  context.restore();
}

function renderGeneratedSignature(
  signerName: string,
  styleName: SignatureStyle,
  ink: SignatureInk,
  useInitials: boolean
) {
  const option = styles.find((item) => item.value === styleName) ?? styles[0];
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context) return "";

  const text = useInitials || styleName === "Monograma" ? getInitials(signerName) : signerName.trim();
  const color = inkColors[ink];
  let fontSize = useInitials || styleName === "Monograma" ? 205 : 150;
  const fontStyle = option.italic ? "italic" : "normal";

  do {
    context.font = `${fontStyle} ${option.weight} ${fontSize}px ${option.fontFamily}`;
    fontSize -= 4;
  } while (context.measureText(text || "Assinatura").width > 920 && fontSize > 64);

  context.save();
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.translate(canvas.width / 2, canvas.height * 0.48);
  context.transform(1, 0, option.italic ? -0.12 : 0, 1, 0, 0);
  context.fillText(text || "Assinatura", 0, 0);
  context.restore();
  drawFlourish(context, option.flourish, canvas.width, canvas.height, color);

  return canvas.toDataURL("image/png");
}

function modeLabel(mode?: SignatureMode) {
  if (!mode || mode === "Pendente") return "Ainda não salva";
  return mode;
}

export type SignatureStudioProps = {
  initialValue?: Partial<SignatureData>;
  onConfirm: (signature: SignatureData) => void | Promise<void>;
  confirmLabel?: string;
  termsLabel?: string;
  requireTerms?: boolean;
  saving?: boolean;
  externalError?: string;
  compact?: boolean;
};

export function SignatureStudio({
  initialValue,
  onConfirm,
  confirmLabel = "Confirmar assinatura",
  termsLabel = "Confirmo que li o documento, concordo com seu conteúdo e autorizo o uso desta assinatura eletrônica.",
  requireTerms = true,
  saving = false,
  externalError = "",
  compact = false
}: SignatureStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [signerName, setSignerName] = useState(initialValue?.signerName || "");
  const [activeTab, setActiveTab] = useState<StudioTab>(tabFromMode(initialValue?.mode));
  const [selectedStyle, setSelectedStyle] = useState<SignatureStyle>(initialValue?.signatureStyle || "Clássica");
  const [brush, setBrush] = useState<SignatureBrush>(initialValue?.brushStyle || "Caneta assinatura");
  const [ink, setInk] = useState<SignatureInk>(initialValue?.inkColor || "Preta");
  const [uploadedDataUrl, setUploadedDataUrl] = useState(initialValue?.mode === "Imagem enviada" ? initialValue.signatureDataUrl || "" : "");
  const [acceptedTerms, setAcceptedTerms] = useState(requireTerms ? Boolean(initialValue?.acceptedTerms) : true);
  const [strokeCount, setStrokeCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [localError, setLocalError] = useState("");
  const [internalSaving, setInternalSaving] = useState(false);

  const initials = useMemo(() => getInitials(signerName), [signerName]);
  const selectedStyleOption = styles.find((item) => item.value === selectedStyle) ?? styles[0];
  const previewDataUrl = activeTab === "upload" ? uploadedDataUrl : initialValue?.signatureDataUrl || "";

  const drawCanvas = useCallback((includeActive = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const allStrokes = includeActive && activeStrokeRef.current
      ? [...strokesRef.current, activeStrokeRef.current]
      : strokesRef.current;

    for (const stroke of allStrokes) {
      const points = stroke.points;
      if (!points.length) continue;
      const color = inkColors[stroke.ink];
      const baseWidth = brushWidths[stroke.brush];
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineCap = "round";
      context.lineJoin = "round";

      if (points.length === 1) {
        const point = points[0];
        context.beginPath();
        context.arc(point.x * width, point.y * height, Math.max(1, baseWidth * 0.7), 0, Math.PI * 2);
        context.fill();
        continue;
      }

      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const pressure = Math.max(0.18, (previous.pressure + current.pressure) / 2);
        context.lineWidth = baseWidth * (0.65 + pressure * 0.75);
        context.beginPath();
        context.moveTo(previous.x * width, previous.y * height);
        context.lineTo(current.x * width, current.y * height);
        context.stroke();
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "draw" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => drawCanvas());
    observer.observe(canvas);
    drawCanvas();
    return () => observer.disconnect();
  }, [activeTab, drawCanvas]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height))),
      pressure: event.pressure > 0 ? event.pressure : 0.5
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStrokeRef.current = { points: [pointFromEvent(event)], brush, ink };
    setLocalError("");
    drawCanvas();
  }

  function continueDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current !== event.pointerId || !activeStrokeRef.current) return;
    event.preventDefault();
    activeStrokeRef.current.points.push(pointFromEvent(event));
    drawCanvas();
  }

  function finishDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current !== event.pointerId || !activeStrokeRef.current) return;
    event.preventDefault();
    activeStrokeRef.current.points.push(pointFromEvent(event));
    strokesRef.current = [...strokesRef.current, activeStrokeRef.current];
    activeStrokeRef.current = null;
    activePointerRef.current = null;
    redoRef.current = [];
    setStrokeCount(strokesRef.current.length);
    setRedoCount(0);
    drawCanvas(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function undo() {
    const last = strokesRef.current.at(-1);
    if (!last) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, last];
    setStrokeCount(strokesRef.current.length);
    setRedoCount(redoRef.current.length);
    drawCanvas(false);
  }

  function redo() {
    const last = redoRef.current.at(-1);
    if (!last) return;
    redoRef.current = redoRef.current.slice(0, -1);
    strokesRef.current = [...strokesRef.current, last];
    setStrokeCount(strokesRef.current.length);
    setRedoCount(redoRef.current.length);
    drawCanvas(false);
  }

  function clearDrawing() {
    strokesRef.current = [];
    redoRef.current = [];
    activeStrokeRef.current = null;
    activePointerRef.current = null;
    setStrokeCount(0);
    setRedoCount(0);
    drawCanvas(false);
  }

  function normalizeUploadedImage(file: File) {
    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      throw new Error("Envie uma imagem PNG, JPG, JPEG ou WebP.");
    }
    if (file.size > 4 * 1024 * 1024) {
      throw new Error("A imagem deve ter no máximo 4 MB.");
    }

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("A imagem enviada não é válida."));
        image.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 500;
          const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) {
            reject(new Error("Não foi possível processar a imagem."));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          for (let index = 0; index < pixels.data.length; index += 4) {
            const red = pixels.data[index];
            const green = pixels.data[index + 1];
            const blue = pixels.data[index + 2];
            const lightness = Math.min(red, green, blue);
            if (lightness > 238) pixels.data[index + 3] = 0;
            else if (lightness > 215) pixels.data[index + 3] = Math.round(pixels.data[index + 3] * ((238 - lightness) / 23));
          }
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.putImageData(pixels, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        image.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLocalError("");
      setUploadedDataUrl(await normalizeUploadedImage(file));
    } catch (uploadError) {
      setUploadedDataUrl("");
      setLocalError(uploadError instanceof Error ? uploadError.message : "Não foi possível processar a imagem.");
    } finally {
      event.target.value = "";
    }
  }

  function selectTab(tab: StudioTab) {
    setActiveTab(tab);
    setLocalError("");
  }

  async function confirm() {
    try {
      setLocalError("");
      const normalizedName = signerName.trim();
      if (normalizedName.length < 3) throw new Error("Digite o nome completo do assinante.");
      if (requireTerms && !acceptedTerms) throw new Error("Confirme a leitura e o aceite antes de assinar.");

      let mode: SignatureMode;
      let signatureDataUrl = "";

      if (activeTab === "draw") {
        if (!strokesRef.current.length) throw new Error("Faça sua assinatura no campo branco.");
        mode = "Assinatura livre";
        signatureDataUrl = canvasRef.current?.toDataURL("image/png") || "";
      } else if (activeTab === "models") {
        mode = "Rubrica predefinida";
        signatureDataUrl = renderGeneratedSignature(normalizedName, selectedStyle, ink, false);
      } else if (activeTab === "initials") {
        mode = "Rubrica por iniciais";
        signatureDataUrl = renderGeneratedSignature(normalizedName, selectedStyle, ink, true);
      } else if (activeTab === "upload") {
        if (!uploadedDataUrl) throw new Error("Envie a imagem da assinatura antes de continuar.");
        mode = "Imagem enviada";
        signatureDataUrl = uploadedDataUrl;
      } else {
        mode = "Nome digitado + aceite";
        signatureDataUrl = renderGeneratedSignature(normalizedName, "Formal", ink, false);
      }

      const result: SignatureData = {
        signerName: normalizedName,
        mode,
        signedAt: todayIso(),
        signatureDataUrl,
        signatureStyle: activeTab === "typed" ? "Formal" : selectedStyle,
        acceptedTerms: requireTerms ? acceptedTerms : true,
        brushStyle: brush,
        inkColor: ink,
        initials
      };

      setInternalSaving(true);
      await onConfirm(result);
    } catch (confirmError) {
      setLocalError(confirmError instanceof Error ? confirmError.message : "Não foi possível registrar a assinatura.");
    } finally {
      setInternalSaving(false);
    }
  }

  const isBusy = saving || internalSaving;

  return (
    <div className={`overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#080c11] ${compact ? "p-3" : "p-4 md:p-5"}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-volt-yellow text-black"><PenLine size={18} /></span>
            <div>
              <p className="font-black text-white">Estúdio de assinatura</p>
              <p className="text-xs text-zinc-500">Escolha como deseja assinar.</p>
            </div>
          </div>
        </div>
        <span className="self-start rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-zinc-400">
          {modeLabel(initialValue?.mode)}
        </span>
      </div>

      <label className="mt-4 block rounded-2xl border border-white/10 bg-black/30 p-3">
        <span className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">Nome completo do assinante</span>
        <input
          value={signerName}
          onChange={(event) => setSignerName(event.target.value)}
          autoComplete="name"
          placeholder="Digite o nome completo"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm font-bold text-white outline-none focus:border-volt-yellow/50"
        />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              aria-pressed={active}
              title={tab.label}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-black transition ${active ? "border-volt-yellow bg-volt-yellow text-black" : "border-white/10 bg-white/[.025] text-zinc-400 hover:border-volt-yellow/35 hover:text-volt-yellow"}`}
            >
              <Icon size={16} />
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "draw" && (
        <div className="mt-4">
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <label className="rounded-xl border border-white/10 bg-black/25 p-3">
              <span className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-600">Tipo de caneta</span>
              <select value={brush} onChange={(event) => setBrush(event.target.value as SignatureBrush)} className="mt-2 w-full bg-transparent text-xs font-bold text-zinc-200 outline-none">
                {(Object.keys(brushWidths) as SignatureBrush[]).map((option) => <option key={option} className="bg-[#080c11]">{option}</option>)}
              </select>
            </label>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <span className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-600">Cor da tinta</span>
              <div className="mt-2 flex gap-2">
                {(Object.keys(inkColors) as SignatureInk[]).map((option) => (
                  <button key={option} type="button" onClick={() => setInk(option)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-black ${ink === option ? "border-volt-yellow bg-volt-yellow/10 text-volt-yellow" : "border-white/10 text-zinc-400"}`}>
                    <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: inkColors[option] }} />{option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-volt-yellow/35 bg-white shadow-inner">
            <div className="border-b border-black/10 bg-zinc-100 px-3 py-2 text-center text-[10px] font-bold text-zinc-500">Assine no espaço abaixo — você pode tirar o dedo e continuar</div>
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={finishDrawing}
              onPointerCancel={finishDrawing}
              className="h-48 w-full touch-none cursor-crosshair bg-white sm:h-52"
              aria-label="Campo para desenhar a assinatura"
            />
            <div className="flex items-center justify-between gap-2 border-t border-black/10 bg-zinc-100 p-2">
              <p className="px-1 text-[10px] font-bold text-zinc-500">{strokeCount} {strokeCount === 1 ? "traço salvo" : "traços salvos"}</p>
              <div className="flex gap-1">
                <button type="button" onClick={undo} disabled={!strokeCount} className="rounded-lg border border-black/10 p-2 text-zinc-700 disabled:opacity-30" title="Desfazer"><Undo2 size={16} /></button>
                <button type="button" onClick={redo} disabled={!redoCount} className="rounded-lg border border-black/10 p-2 text-zinc-700 disabled:opacity-30" title="Refazer"><Redo2 size={16} /></button>
                <button type="button" onClick={clearDrawing} disabled={!strokeCount} className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-700 disabled:opacity-30" title="Limpar"><Eraser size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === "models" || activeTab === "initials") && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
            <div>
              <p className="text-xs font-black text-zinc-200">{activeTab === "models" ? "12 modelos originais" : `Rubrica com as iniciais ${initials || "—"}`}</p>
              <p className="mt-1 text-[10px] text-zinc-500">Escolha o estilo e a cor. O resultado será gravado como imagem.</p>
            </div>
            <div className="flex gap-1">
              {(Object.keys(inkColors) as SignatureInk[]).map((option) => <button key={option} type="button" onClick={() => setInk(option)} title={`Tinta ${option.toLocaleLowerCase("pt-BR")}`} className={`h-8 w-8 rounded-full border-2 ${ink === option ? "border-volt-yellow" : "border-white/20"}`} style={{ backgroundColor: inkColors[option] }} />)}
            </div>
          </div>
          <div className="grid max-h-[34rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {styles.map((style) => {
              const active = selectedStyle === style.value;
              const preview = activeTab === "initials" || style.value === "Monograma" ? initials || "GS" : signerName || "Seu nome";
              return (
                <button key={style.value} type="button" onClick={() => setSelectedStyle(style.value)} className={`overflow-hidden rounded-2xl border text-left transition ${active ? "border-volt-yellow ring-1 ring-volt-yellow/50" : "border-white/10 hover:border-white/25"}`}>
                  <div className="relative grid h-24 place-items-center overflow-hidden bg-white px-3 text-center text-slate-900">
                    <span className={`${style.previewClass} max-w-full truncate`} style={{ color: inkColors[ink] }}>{preview}</span>
                    <span className="absolute bottom-3 left-[16%] right-[16%] h-px bg-current opacity-35" style={{ color: inkColors[ink] }} />
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-black/25 p-3">
                    <div><p className="text-xs font-black text-zinc-200">{style.label}</p><p className="mt-0.5 text-[10px] text-zinc-600">{style.description}</p></div>
                    {active && <span className="grid h-6 w-6 place-items-center rounded-full bg-volt-yellow text-black"><Check size={14} /></span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "upload" && (
        <div className="mt-4">
          <label className="grid min-h-48 cursor-pointer place-items-center rounded-2xl border border-dashed border-volt-yellow/35 bg-black/25 p-5 text-center transition hover:bg-volt-yellow/[.04]">
            {uploadedDataUrl ? (
              <div className="w-full">
                <img src={uploadedDataUrl} alt="Prévia da assinatura enviada" className="mx-auto h-32 max-w-full object-contain rounded-xl bg-white p-3" />
                <p className="mt-3 text-xs font-black text-volt-yellow">Imagem pronta. Clique para trocar.</p>
              </div>
            ) : (
              <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-volt-yellow text-black"><Upload size={22} /></span><p className="mt-3 font-black text-white">Enviar foto ou arquivo da assinatura</p><p className="mt-1 text-xs leading-5 text-zinc-500">PNG, JPG ou WebP, até 4 MB. O fundo branco será removido.</p></div>
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleUpload(event)} className="sr-only" />
          </label>
          <div className="mt-3 flex gap-3 rounded-xl border border-blue-400/20 bg-blue-400/[.06] p-3 text-xs leading-5 text-zinc-400"><ImageUp className="mt-0.5 shrink-0 text-blue-300" size={17} /><p>Use somente uma assinatura sua ou de pessoa que autorizou expressamente este uso.</p></div>
        </div>
      )}

      {activeTab === "typed" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid min-h-40 place-items-center bg-white p-5 text-center text-slate-900">
            <div>
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={22} /></div>
              <p className="mt-3 font-serif text-2xl font-bold">{signerName || "Digite seu nome"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Nome digitado com aceite eletrônico</p>
            </div>
          </div>
          <div className="bg-black/25 p-3 text-xs leading-5 text-zinc-500">Esta opção registra o nome completo, a data, a hora e as evidências técnicas do aceite.</div>
        </div>
      )}

      {previewDataUrl && activeTab !== "upload" && activeTab !== "draw" && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white p-3"><img src={previewDataUrl} alt="Assinatura atual" className="mx-auto h-24 max-w-full object-contain" /></div>
      )}

      {requireTerms && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-zinc-300">
          <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-volt-yellow" />
          <span>{termsLabel}</span>
        </label>
      )}

      {(localError || externalError) && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{localError || externalError}</div>}

      <button type="button" onClick={() => void confirm()} disabled={isBusy} className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-50">
        {isBusy ? <><RotateCcw className="animate-spin" size={17} /> Salvando assinatura...</> : <><PenLine size={17} /> {confirmLabel}</>}
      </button>
    </div>
  );
}

export { styles as signatureStyleOptions };
