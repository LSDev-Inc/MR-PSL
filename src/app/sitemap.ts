import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteBaseUrl();
  if (!origin) return [];
  const base = origin.toString().replace(/\/$/, "");
  return ["", "/programma", "/candidati", "/partecipa", "/privacy", "/informazioni"].map(route => ({
    url: `${base}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
