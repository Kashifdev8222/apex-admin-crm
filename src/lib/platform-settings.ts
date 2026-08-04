import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  defaultLeverage: number;
  maxLeverage: number;
  minDepositUsd: number;
  baseCurrency: string;
  marginCallPct: number;
  stopOutPct: number;
  commissionPerLot: number;
  withdrawalFee: number;
  spreadMarkup: number;
  depositFeePct: number;
};

export type AiSettings = {
  emergencyStop: boolean;
  positionSizePct: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxDrawdownPct: number;
  maxDailyTrades: number;
  maxLeverage: string;
};

export const DEFAULT_PLATFORM: PlatformSettings = {
  defaultLeverage: 500,
  maxLeverage: 500,
  minDepositUsd: 250,
  baseCurrency: "USD",
  marginCallPct: 100,
  stopOutPct: 30,
  commissionPerLot: 7,
  withdrawalFee: 0,
  spreadMarkup: 0.5,
  depositFeePct: 0,
};

export const DEFAULT_AI: AiSettings = {
  emergencyStop: false,
  positionSizePct: 5,
  stopLossPct: 2.5,
  takeProfitPct: 5,
  maxDrawdownPct: 15,
  maxDailyTrades: 20,
  maxLeverage: "1:500",
};

const DATA_DIR = path.join(process.cwd(), "data");

async function readFileJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

async function writeFileJson(file: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

type SettingRow = { data: unknown };

async function readDbBucket(key: string): Promise<Record<string, unknown> | null> {
  try {
    const rows = await prisma.$queryRaw<SettingRow[]>`
      SELECT data FROM platform_settings WHERE id = ${key} LIMIT 1
    `;
    if (!rows[0]?.data || typeof rows[0].data !== "object") return null;
    return rows[0].data as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function writeDbBucket(key: string, data: unknown) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO platform_settings (id, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET data = EXCLUDED.data, updated_at = now()`,
    key,
    JSON.stringify(data),
  );
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const fromDb = await readDbBucket("platform");
  if (fromDb) return { ...DEFAULT_PLATFORM, ...fromDb } as PlatformSettings;
  return readFileJson("platform-settings.json", DEFAULT_PLATFORM);
}

export async function savePlatformSettings(data: PlatformSettings) {
  try {
    await writeDbBucket("platform", data);
    return;
  } catch {
    await writeFileJson("platform-settings.json", data);
  }
}

export async function getAiSettings(): Promise<AiSettings> {
  const fromDb = await readDbBucket("ai");
  if (fromDb) return { ...DEFAULT_AI, ...fromDb } as AiSettings;
  return readFileJson("ai-settings.json", DEFAULT_AI);
}

export async function saveAiSettings(data: AiSettings) {
  try {
    await writeDbBucket("ai", data);
    return;
  } catch {
    await writeFileJson("ai-settings.json", data);
  }
}

/** Tag used on Client.tags JSON array for AI enabled */
export const AI_TAG = "ai_enabled";

export function clientHasAi(tags: unknown): boolean {
  return Array.isArray(tags) && tags.includes(AI_TAG);
}
