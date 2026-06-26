import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const REQUIRED_TABLES = [
  "analyses",
  "workspaces",
  "workspace_members",
  "workspace_invitations",
  "user_preferences",
  "activity_events",
  "share_links",
  "integration_tokens",
];

const POOLER_REGIONS = [
  "ap-south-1",
  "us-east-1",
  "us-west-1",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
];

function poolerUrls(projectRef, encodedPassword) {
  const urls = [];
  for (const prefix of ["aws-0", "aws-1"]) {
    for (const region of POOLER_REGIONS) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      urls.push(`postgresql://postgres.${projectRef}:${encodedPassword}@${host}:6543/postgres`);
      urls.push(`postgresql://postgres.${projectRef}:${encodedPassword}@${host}:5432/postgres`);
    }
  }
  return urls;
}

function loadEnvFile(filename) {
  const path = join(root, filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function projectRefFromUrl(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function parseDbCredentials() {
  const explicit =
    process.env.SUPABASE_DB_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;

  const ref =
    process.env.SUPABASE_PROJECT_REF ??
    projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  let password = process.env.SUPABASE_DB_PASSWORD;

  if (explicit && !explicit.includes("[YOUR-PASSWORD]")) {
    try {
      const url = new URL(explicit);
      password = password ?? decodeURIComponent(url.password);
      const hostRef = url.hostname.match(/^db\.([^.]+)\.supabase\.co$/)?.[1];
      const projectRef = ref ?? hostRef;
      if (password && projectRef) {
        const encoded = encodeURIComponent(password);
        return {
          ref: projectRef,
          password,
          urls: [
            explicit,
            ...poolerUrls(projectRef, encoded),
          ],
        };
      }
      return { ref: projectRef, password, urls: [explicit] };
    } catch {
      return { ref, password, urls: [explicit] };
    }
  }

  if (!password || !ref) return null;

  const encoded = encodeURIComponent(password);
  const urls = [
    `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
    ...poolerUrls(ref, encoded),
  ];

  return { ref, password, urls };
}

function tableMissing(error) {
  if (!error) return false;
  const msg = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
}

async function checkTablesViaApi() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existing = [];
  const missing = [];

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error && tableMissing(error)) {
      missing.push(table);
    } else if (error) {
      console.warn(`  ? ${table}: [${error.code}] ${error.message}`);
      missing.push(table);
    } else {
      existing.push(table);
    }
  }

  return { existing, missing };
}

async function checkTablesViaDb(client) {
  const { rows } = await client.query(
    `
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any($1::text[])
    order by table_name
  `,
    [REQUIRED_TABLES]
  );

  const existing = rows.map((r) => r.table_name);
  const missing = REQUIRED_TABLES.filter((t) => !existing.includes(t));
  return { existing, missing };
}

async function connectPostgres(urls) {
  let lastError = null;
  for (const connectionString of urls) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      const host = connectionString.split("@")[1]?.split("/")[0] ?? "postgres";
      console.log(`✓ Connected via Postgres (${host})\n`);
      return client;
    } catch (err) {
      lastError = err;
      await client.end().catch(() => {});
    }
  }
  throw lastError ?? new Error("Could not connect to Postgres");
}

async function applySchema(client, relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Schema file not found: ${relativePath}`);
  }

  const sql = readFileSync(fullPath, "utf8");
  console.log(`→ Applying ${relativePath}...`);
  await client.query(sql);
  console.log(`✓ ${relativePath}`);
}

async function main() {
  console.log("CodeMedic AI — database setup\n");

  const creds = parseDbCredentials();
  let client = null;
  let check = null;

  if (creds?.urls?.length) {
    try {
      client = await connectPostgres(creds.urls);
      check = await checkTablesViaDb(client);
    } catch (err) {
      console.error("Postgres connection failed:", err.message);
      console.log("Falling back to API table check...\n");
      client = null;
    }
  }

  if (!check) {
    check = await checkTablesViaApi();
    if (!check) {
      console.error("Could not check tables. Add SUPABASE_DB_URL to .env.local");
      process.exit(1);
    }
    console.log("(Checked via Supabase API)\n");
  }

  console.log("Existing tables:");
  if (check.existing.length === 0) console.log("  (none)");
  else check.existing.forEach((t) => console.log(`  ✓ ${t}`));

  console.log("\nMissing tables:");
  if (check.missing.length === 0) console.log("  (none — all required tables exist)");
  else check.missing.forEach((t) => console.log(`  ✗ ${t}`));

  if (check.missing.length === 0) {
    if (client) {
      console.log("\nApplying security policies...\n");
      await applySchema(client, "supabase/schema-v2-security.sql");
    }
    console.log("\nDone. Nothing to create.");
    if (client) await client.end();
    return;
  }

  if (!client) {
    if (!creds?.urls?.length) {
      console.error("\nAdd SUPABASE_DB_URL to .env.local to create missing tables.");
      process.exit(1);
    }
    try {
      client = await connectPostgres(creds.urls);
    } catch (err) {
      console.error("\nCannot connect to Postgres:", err.message);
      console.error("\nRun schema-v2.sql manually in Supabase → SQL Editor.");
      process.exit(1);
    }
  }

  const needsV1 = check.missing.includes("analyses");
  const needsV2 = check.missing.some((t) => t !== "analyses");

  console.log("\nCreating missing tables...\n");

  try {
    if (needsV1) await applySchema(client, "supabase/schema.sql");
    if (needsV2) await applySchema(client, "supabase/schema-v2.sql");
    await applySchema(client, "supabase/schema-v2-security.sql");

    const after = await checkTablesViaDb(client);
    console.log("\nAfter setup:");
    after.existing.forEach((t) => console.log(`  ✓ ${t}`));
    if (after.missing.length > 0) {
      console.log("\nStill missing:");
      after.missing.forEach((t) => console.log(`  ✗ ${t}`));
      process.exit(1);
    }
    console.log("\nDone. Refresh Supabase Table Editor (public schema) — you should see 8 tables.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
