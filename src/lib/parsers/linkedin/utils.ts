import type { DemographicCategory } from "./types";

/**
 * Parse "d/M/yyyy" date string → "yyyy-MM-dd"
 * Examples: "21/8/2025" → "2025-08-21", "1/9/2025" → "2025-09-01"
 */
export function parseSlashDate(raw: string): string {
  const [d, m, y] = raw.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const SPANISH_MONTHS: Record<string, string> = {
  "ene.": "01",
  "feb.": "02",
  "mar.": "03",
  "abr.": "04",
  "may.": "05",
  "jun.": "06",
  "jul.": "07",
  "ago.": "08",
  "sep.": "09",
  "sept.": "09",
  "oct.": "10",
  "nov.": "11",
  "dic.": "12",
};

/**
 * Parse Spanish date "17 feb. 2026" → "2026-02-17"
 */
export function parseSpanishDate(raw: string): string {
  const parts = raw.trim().split(/\s+/);
  const day = parts[0].padStart(2, "0");
  const month = SPANISH_MONTHS[parts[1].toLowerCase()];
  if (!month) throw new Error(`Unknown Spanish month: ${parts[1]} in "${raw}"`);
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

/**
 * Parse "d/M/yyyy - d/M/yyyy" → [start, end]
 */
export function parseDateRange(raw: string): [string, string] {
  const [start, end] = raw.split(" - ");
  return [parseSlashDate(start.trim()), parseSlashDate(end.trim())];
}

/**
 * Parse "del 17 feb. 2026 al 21 feb. 2026" → [start, end]
 */
export function parseSpanishDateRange(
  raw: string,
): [string, string] | [null, null] {
  const match = raw.match(/del\s+(.+?)\s+al\s+(.+)/);
  if (!match) return [null, null];
  return [parseSpanishDate(match[1]), parseSpanishDate(match[2])];
}

/**
 * Parse Spanish-formatted number string (dot = thousands separator).
 * "12.343" → 12343, "5.063" → 5063, "381" → 381
 */
export function parseSpanishNumber(raw: string | number): number {
  if (typeof raw === "number") return Math.round(raw);
  return parseInt(raw.replace(/\./g, ""), 10);
}

/**
 * Parse duration string to total seconds.
 * "41 h 6 min 46 s" → 147806, "32 s" → 32, "1 h 53 min 6 s" → 6786
 */
export function parseDuration(raw: string): number {
  let seconds = 0;
  const h = raw.match(/(\d+)\s*h/);
  const m = raw.match(/(\d+)\s*min/);
  const s = raw.match(/(\d+)\s*s/);
  if (h) seconds += parseInt(h[1], 10) * 3600;
  if (m) seconds += parseInt(m[1], 10) * 60;
  if (s) seconds += parseInt(s[1], 10);
  return seconds;
}

/**
 * Parse percentage: float 0.2155 → 21.55, or "< 1 %" → 0.5
 * The "< 1 %" string may contain non-breaking spaces (\xa0).
 */
export function parsePercentage(raw: string | number): number {
  if (typeof raw === "number") {
    return Math.round(raw * 10000) / 100; // 0.2155 → 21.55
  }
  // Normalize non-breaking spaces and regular spaces
  const normalized = raw.replace(/\u00a0/g, " ").trim();
  if (normalized.includes("<")) {
    return 0.5; // "< 1 %" → treat as 0.5%
  }
  // Try parsing as float (shouldn't normally happen for strings)
  return parseFloat(normalized);
}

/**
 * Extract the numeric platform ID from a LinkedIn URL.
 * Handles urn:li:activity:, urn:li:ugcPost:, urn:li:share:
 * "https://www.linkedin.com/feed/update/urn:li:activity:7396176764034785281" → "7396176764034785281"
 */
export function extractPlatformId(url: string): string {
  const match = url.match(/(\d{10,})(?:[/?#]|$)/);
  if (!match) throw new Error(`Cannot extract platform ID from URL: ${url}`);
  return match[1];
}

const CATEGORY_MAP: Record<string, DemographicCategory> = {
  // Aggregate (plural)
  Cargos: "job_title",
  Ubicaciones: "location",
  Sectores: "industry",
  Empresas: "company",
  // Per-post (singular)
  Cargo: "job_title",
  "Ubicacion": "location",
  "Ubicación": "location",
  Sector: "industry",
  Empresa: "company",
  // Same in both
  "Nivel de responsabilidad": "seniority",
  "Tamano de la empresa": "company_size",
  "Tamaño de la empresa": "company_size",
};

/**
 * Map Spanish category name to canonical English key.
 * Handles both plural (aggregate) and singular (per-post) variants.
 */
export function mapCategoryName(spanish: string): DemographicCategory {
  // Normalize: remove accents for matching
  const normalized = spanish
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const mapped = CATEGORY_MAP[normalized] ?? CATEGORY_MAP[spanish.trim()];
  if (!mapped) throw new Error(`Unknown demographic category: "${spanish}"`);
  return mapped;
}

/**
 * Read a cell value as string, handling null/undefined and ExcelJS objects.
 * ExcelJS hyperlinks come as { text: "...", hyperlink: "..." }.
 * ExcelJS rich text comes as { richText: [...] }.
 */
export function cellStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Hyperlink object
    if ("text" in obj && typeof obj.text === "string") return obj.text.trim();
    if ("hyperlink" in obj && typeof obj.hyperlink === "string")
      return obj.hyperlink.trim();
    // Rich text
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return obj.richText
        .map((rt: { text?: string }) => rt.text ?? "")
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

/**
 * Read a cell value as number, handling null/undefined/floats.
 */
export function cellNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Math.round(value);
  return parseSpanishNumber(String(value));
}
