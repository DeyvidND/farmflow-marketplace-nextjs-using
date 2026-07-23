import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: no incremental cache binding (ISR falls back to in-worker).
// Add R2/KV cache here later if persisted ISR across instances is needed.
export default defineCloudflareConfig();
