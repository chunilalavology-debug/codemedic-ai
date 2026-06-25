import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl =
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

async function createBucket() {
  if (!supabaseUrl || !serviceRoleKey) {
    console.log("Skipping bucket API step (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
    return false;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw new Error(`Could not list buckets: ${listError.message}`);

  if (buckets.some((bucket) => bucket.id === "avatars")) {
    console.log("✓ avatars bucket already exists");
    return true;
  }

  const { error: createError } = await admin.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  if (createError) throw new Error(`Could not create avatars bucket: ${createError.message}`);

  console.log("✓ Created avatars bucket");
  return true;
}

async function applyPolicies() {
  if (!dbUrl) {
    console.log("\nDatabase URL not found. Apply policies manually:");
    console.log("  1. Open Supabase Dashboard → SQL Editor");
    console.log("  2. Paste the contents of supabase/avatars-bucket.sql");
    console.log("  3. Click Run\n");
    return false;
  }

  const sql = readFileSync(join(root, "supabase", "avatars-bucket.sql"), "utf8");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ Applied avatar storage policies");
    return true;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log("CodeMedic AI — avatar storage setup\n");

  await createBucket();
  const policiesApplied = await applyPolicies();

  if (policiesApplied) {
    console.log("\nDone. Profile photo uploads should work now.");
    return;
  }

  console.log("Next step: run supabase/avatars-bucket.sql in the Supabase SQL Editor, then retry upload.");
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
