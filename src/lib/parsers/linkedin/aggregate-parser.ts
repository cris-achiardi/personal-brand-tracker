import ExcelJS from "exceljs";
import type {
  AggregateReport,
  AggregateDiscovery,
  DailyEngagement,
  FollowersSummary,
  DemographicRow,
} from "./types";
import {
  parseSlashDate,
  parseDateRange,
  parsePercentage,
  mapCategoryName,
  cellStr,
  cellNum,
} from "./utils";

export async function parseAggregateReport(
  filePath: string,
): Promise<AggregateReport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const discovery = parseDiscovery(workbook);
  const dailyEngagement = parseEngagement(workbook);
  const followers = parseFollowers(workbook);
  const demographics = parseDemographics(workbook);

  return { discovery, dailyEngagement, followers, demographics };
}

// ── Sheet 1: DESCUBRIMIENTO ─────────────────────────────────────────────────

function parseDiscovery(workbook: ExcelJS.Workbook): AggregateDiscovery {
  const sheet = findSheet(workbook, "DESCUBRIMIENTO");
  // Row 1: "Rendimiento general" | "21/8/2025 - 21/2/2026"
  const dateRange = cellStr(sheet.getRow(1).getCell(2).value);
  const [periodStart, periodEnd] = parseDateRange(dateRange);

  // Row 2: "Impresiones" | 154074
  const totalImpressions = cellNum(sheet.getRow(2).getCell(2).value);
  // Row 3: "Miembros alcanzados" | 32456
  const totalMembersReached = cellNum(sheet.getRow(3).getCell(2).value);

  return { periodStart, periodEnd, totalImpressions, totalMembersReached };
}

// ── Sheet 2: INTERACCION ────────────────────────────────────────────────────

function parseEngagement(workbook: ExcelJS.Workbook): DailyEngagement[] {
  const sheet = findSheet(workbook, "INTERACCI");
  const rows: DailyEngagement[] = [];

  // Row 1 is header (Fecha | Impresiones | Interacciones), data starts at row 2
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const dateStr = cellStr(row.getCell(1).value);
    if (!dateStr) return;

    rows.push({
      date: parseSlashDate(dateStr),
      impressions: cellNum(row.getCell(2).value),
      interactions: cellNum(row.getCell(3).value),
    });
  });

  return rows;
}

// ── Sheet 4: SEGUIDORES ─────────────────────────────────────────────────────

function parseFollowers(workbook: ExcelJS.Workbook): FollowersSummary {
  const sheet = findSheet(workbook, "SEGUIDORES");

  // Row 1: "Total de seguidores el 21/2/2026:" | 2086
  const totalFollowers = cellNum(sheet.getRow(1).getCell(2).value);

  // Row 3: headers (Fecha | Nuevos seguidores), data starts at row 4
  const daily: { date: string; newFollowers: number }[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return;
    const dateStr = cellStr(row.getCell(1).value);
    if (!dateStr) return;

    daily.push({
      date: parseSlashDate(dateStr),
      newFollowers: cellNum(row.getCell(2).value),
    });
  });

  return { totalFollowers, daily };
}

// ── Sheet 5: INFORMACION DETALLADA ──────────────────────────────────────────

function parseDemographics(workbook: ExcelJS.Workbook): DemographicRow[] {
  const sheet = findSheet(workbook, "INFORMACION");
  const rows: DemographicRow[] = [];

  // Row 1 is header, data starts at row 2
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
