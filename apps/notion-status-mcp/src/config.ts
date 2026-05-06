import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import type { AppConfig, TransportMode } from "./types.js";

const argsSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("stdio"),
  port: z.number().int().positive().optional(),
});

function loadEnvFile(envPath = resolve(process.cwd(), ".env")): void {
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): z.infer<typeof argsSchema> {
  const raw: { transport?: TransportMode; port?: number } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--transport" && (next === "stdio" || next === "http")) {
      raw.transport = next;
      index += 1;
      continue;
    }

    if (current === "--port" && next) {
      raw.port = Number(next);
      index += 1;
    }
  }

  return argsSchema.parse(raw);
}

const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1, "NOTION_TOKEN is required"),
  DEFAULT_DATABASE_ID: z.string().min(1, "DEFAULT_DATABASE_ID is required"),
  API_KEY: z.string().optional(),
  PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 3000))
    .pipe(z.number().int().positive()),
  CORS_ORIGIN: z.string().default("*"),
});

export function getConfig(argv = process.argv.slice(2)): AppConfig {
  loadEnvFile();

  const args = parseArgs(argv);
  const env = envSchema.parse(process.env);

  return {
    notionToken: env.NOTION_TOKEN,
    databaseId: env.DEFAULT_DATABASE_ID,
    apiKey: env.API_KEY,
    port: args.port ?? env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    transport: args.transport,
  };
}
