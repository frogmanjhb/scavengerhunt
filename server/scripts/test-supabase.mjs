import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env") });
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || "hunt-photos";

console.log("SUPABASE_URL:", url);
console.log("KEY present:", Boolean(key));

try {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  console.log("GET /storage/v1/bucket:", res.status, res.statusText);
  console.log((await res.text()).slice(0, 300));
} catch (e) {
  console.error("Raw fetch failed:", e?.message);
  console.error("Cause:", e?.cause ?? "(none)");
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const tiny = Buffer.from("test");
const objectPath = `party/diagnostic-${Date.now()}.txt`;
const { error: upErr } = await sb.storage.from(bucket).upload(objectPath, tiny, {
  contentType: "text/plain",
});
console.log("Upload test:", upErr ? upErr.message : "ok");
if (upErr) console.log("Upload error details:", JSON.stringify(upErr, null, 2));