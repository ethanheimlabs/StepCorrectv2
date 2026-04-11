import path from "path";
import { tmpdir } from "os";

function resolveStoreRoot() {
  const configuredRoot = process.env.STEPCORRECT_STORE_DIR?.trim();

  if (configuredRoot) {
    return configuredRoot;
  }

  if (process.env.VERCEL || process.cwd().startsWith("/var/task")) {
    // Vercel serverless deployments can write to /tmp, but not to /var/task.
    return path.join(tmpdir(), "stepcorrect");
  }

  return path.join(process.cwd(), ".data");
}

export function resolveWritableDataPath(filename: string) {
  return path.join(resolveStoreRoot(), filename);
}
