import { env } from "@/lib/env";

const placeholderHosts = new Set(["example.com", "www.example.com", "ramadu-studenti.example"]);

export function getSiteBaseUrl() {
  if (!env.APP_URL) return null;
  try {
    const url = new URL(env.APP_URL);
    if (
      url.protocol !== "https:" ||
      placeholderHosts.has(url.hostname) ||
      url.hostname.endsWith(".example") ||
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)
    )
      return null;
    return url;
  } catch {
    return null;
  }
}

export function getCampaignUrl() {
  const base = getSiteBaseUrl();
  return base ? new URL("/partecipa", base).toString() : null;
}
