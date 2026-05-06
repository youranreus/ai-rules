import { randomBytes } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const examplePath = resolve(process.cwd(), ".env.example");

function upsertEnvValue(content: string, name: string, value: string): string {
  const lines = content.split(/\r?\n/);
  let updated = false;

  const nextLines = lines.map((line) => {
    if (!line.startsWith(`${name}=`)) {
      return line;
    }

    updated = true;
    return `${name}=${value}`;
  });

  if (!updated) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }
    nextLines.push(`${name}=${value}`);
  }

  return `${nextLines.join("\n").replace(/\n*$/, "")}\n`;
}

function getEnvValue(content: string, name: string): string | undefined {
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith(`${name}=`)) {
      continue;
    }

    return line.slice(name.length + 1).trim();
  }

  return undefined;
}

async function main(): Promise<void> {
  if (!existsSync(envPath)) {
    await copyFile(examplePath, envPath);
  }

  const envContent = await readFile(envPath, "utf8");
  const existingApiKey = getEnvValue(envContent, "API_KEY");

  if (existingApiKey) {
    console.log("Existing API_KEY found in .env; keeping it unchanged.");
    return;
  }

  const apiKey = randomBytes(32).toString("base64url");
  await writeFile(envPath, upsertEnvValue(envContent, "API_KEY", apiKey), "utf8");

  console.log("Generated API_KEY and wrote it to .env");
}

main().catch((error) => {
  console.error("Failed to initialize .env:", error);
  process.exit(1);
});
