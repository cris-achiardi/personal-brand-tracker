import ExcelJS from "exceljs";
import type {
  PostReport,
  PostPerformance,
  LinkClick,
  EngagementHighlight,
  DemographicRow,
} from "./types";
import {
  parseSpanishDate,
  parseSpanishDateRange,
  parseSpanishNumber,
  parseDuration,
  parsePercentage,
  extractPlatformId,
  mapCategoryName,
  cellStr,
} from "./utils";

export async function parsePostReport(filePath: string): Promise<PostReport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const performance = parsePerformance(workbook);
  const demographics = parseDemographicsSheet(workbook);

  return { performance, demographics };
}

// ── Sheet 1: RENDIMIENTO ────────────────────────────────────────────────────

function parsePerformance(workbook: ExcelJS.Workbook): PostPerformance {
  const sheet = findSheet(workbook, "RENDIMIENTO");

  // Build a label→value map by scanning all rows.
  // Keys are stored with accents stripped for reliable lookup.
  const labelMap = new Map<string, string>();
  const linkClicks: LinkClick[] = [];
  const engagementHighlights: EngagementHighlight[] = [];
  let currentHighlight: Partial<EngagementHighlight> | null = null;

  sheet.eachRow((row) => {
    const rawLabel = cellStr(row.getCell(1).value);
    const value = cellStr(row.getCell(2).value);
    const label = stripAccents(rawLabel);
    if (!label) {
      // Empty row — flush any pending highlight
      if (currentHighlight) {
        engagementHighlights.push(finalizeHighlight(currentHighlight));
        currentHighlight = null;
      }
      return;
    }

    // Engagement highlight header: "Datos destacados de reacciones del ... al ..."
    if (label.startsWith("Datos destacados de")) {
      if (currentHighlight) {
        engagementHighlights.push(finalizeHighlight(currentHighlight));
      }
      currentHighlight = parseHighlightHeader(rawLabel);
      return;
    }

    // Engagement highlight fields
    if (currentHighlight) {
      if (label === "Cargo principal") {
        currentHighlight.topJobTitle = value;
        return;
      }
      if (label.includes("Ubicaci")) {
        currentHighlight.topLocation = value;
        return;
      }
      if (label === "Sector principal") {
        currentHighlight.topIndustry = value;
        return;
      }
    }

    // Check if it's a link URL (after "Visitas a los enlaces")
    if (rawLabel.startsWith("http") && value) {
      linkClicks.push({ url: rawLabel, clicks: parseSpanishNumber(value) });
      return;
    }

    // Store in label map (accent-stripped key)
    labelMap.set(label, value);
  });

  // Flush last highlight
  if (currentHighlight) {
    engagementHighlights.push(finalizeHighlight(currentHighlight));
  }

  // All keys in labelMap are accent-stripped, so use plain ASCII for lookups
  const url = labelMap.get("URL de la publicacion") ?? "";
  const publishedDateRaw = labelMap.get("Fecha de publicacion") ?? "";

  // Video metrics (optional)
  const videoViewsRaw = labelMap.get("Visualizaciones de video");
  const videoWatchTimeRaw = labelMap.get("Tiempo de visualizacion");
  const videoAvgRaw = labelMap.get("Promedio de visualizacion");

  return {
    url,
    platformId: extractPlatformId(url),
    publishedAt: parseSpanishDate(publishedDateRaw),
    publishedTime: labelMap.get("Hora de publicacion") ?? null,
    impressions: parseSpanishNumber(labelMap.get("Impresiones") ?? "0"),
    membersReached: parseSpanishNumber(
      labelMap.get("Miembros alcanzados") ?? "0",
    ),
    linkClicks,
    profileViewsFromPost: parseSpanishNumber(
      labelMap.get("Visualizaciones del perfil desde esta publicacion") ?? "0",
    ),
    followersFromPost: parseSpanishNumber(
      labelMap.get("Seguidores obtenidos a traves de esta publicacion") ?? "0",
    ),
    reactions: parseSpanishNumber(labelMap.get("Reacciones") ?? "0"),
    comments: parseSpanishNumber(labelMap.get("Comentarios") ?? "0"),
    shares: parseSpanishNumber(labelMap.get("Veces compartido") ?? "0"),
    saves: parseSpanishNumber(labelMap.get("Veces guardado") ?? "0"),
    sends: parseSpanishNumber(labelMap.get("Envios en LinkedIn") ?? "0"),
    videoViews: videoViewsRaw ? parseSpanishNumber(videoViewsRaw) : null,
    videoWatchTimeSeconds: videoWatchTimeRaw
      ? parseDuration(videoWatchTimeRaw)
      : null,
    videoAvgWatchSeconds: videoAvgRaw ? parseDuration(videoAvgRaw) : null,
    engagementHighlights,
  };
}

function parseHighlightHeader(
  label: string,
): Partial<EngagementHighlight> {
  // "Datos destacados de reacciones del 17 feb. 2026 al 21 feb. 2026"
  let engagementType: EngagementHighlight["engagementType"] = "reaction";
  if (label.includes("comentarios")) engagementType = "comment";
  else if (label.includes("compartido")) engagementType = "share";

  const [periodStart, periodEnd] = parseSpanishDateRange(label);

  return {
    engagementType,
    periodStart,
    periodEnd,
    topJobTitle: null,
    topLocation: null,
    topIndustry: null,
  };
}

function finalizeHighlight(
  partial: Partial<EngagementHighlight>,
): EngagementHighlight {
  return {
    engagementType: partial.engagementType ?? "reaction",
    periodStart: partial.periodStart ?? null,
    periodEnd: partial.periodEnd ?? null,
    topJobTitle: partial.topJobTitle ?? null,
    topLocation: partial.topLocation ?? null,
    topIndustry: partial.topIndustry ?? null,
  };
}

// ── Sheet 2: INFORMACION DETALLADA PRINCIPAL ────────────────────────────────

function parseDemographicsSheet(workbook: ExcelJS.Workbook): DemographicRow[] {
  const sheet = findSheet(workbook, "INFORMACION");
  const rows: DemographicRow[] = [];

  // Row 1 is header (Categoria | Valor | %), data starts at row 2
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rawCategory = cellStr(row.getCell(1).value);
    const value = cellStr(row.getCell(2).value);
    if (!rawCategory || !value) return;

    rows.push({
      category: mapCategoryName(rawCategory),
      value,
      percentage: parsePercentage(row.getCell(3).value as string | number),
    });
  });

  return rows;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findSheet(workbook: ExcelJS.Workbook, nameFragment: string) {
  const needle = stripAccents(nameFragment).toUpperCase();
  const sheet = workbook.worksheets.find((s) =>
    stripAccents(s.name).toUpperCase().includes(needle),
  );
  if (!sheet)
    throw new Error(
      `Sheet containing "${nameFragment}" not found. Available: ${workbook.worksheets.map((s) => s.name).join(", ")}`,
    );
  return sheet;
}
