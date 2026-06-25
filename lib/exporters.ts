import type { QdcProjectSnapshot } from "@/types";

export function downloadJson(snapshot: QdcProjectSnapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${snapshot.projectName || "qdc-volt"}.json`.replace(/\s+/g, "-").toLowerCase();
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportBoardPng(elementId: string, fileName = "qdc-volt.png") {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Área do QDC não encontrada.");
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, { backgroundColor: "#050505", scale: 2, useCORS: true });
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = fileName;
  anchor.click();
}

export async function exportProjectPdf(elementId: string, title: string, rows: string[]) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Área do QDC não encontrada.");
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(element, { backgroundColor: "#050505", scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text(title, 14, 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Relatório orientativo. Projeto final deve ser conferido por profissional habilitado e normas aplicáveis.", 14, 26, { maxWidth: 180 });
  pdf.addImage(imgData, "PNG", 14, 34, 182, 98);
  let y = 140;
  rows.forEach((row) => {
    if (y > 282) { pdf.addPage(); y = 18; }
    pdf.text(row, 14, y, { maxWidth: 180 });
    y += 6;
  });
  pdf.save(`${title || "qdc-volt"}.pdf`.replace(/\s+/g, "-").toLowerCase());
}
