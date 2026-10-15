import jsQR from "jsqr";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { campaignQrPng, campaignQrSvg } from "@/lib/qr-code";

describe("campaign QR assets", () => {
  const destination = "https://campagna.example.it/partecipa";

  it("decodes the production destination from the generated high-resolution PNG", async () => {
    const buffer = await campaignQrPng(destination);
    const image = PNG.sync.read(buffer);
    const result = jsQR(new Uint8ClampedArray(image.data), image.width, image.height, {
      inversionAttempts: "attemptBoth",
    });
    expect(result?.data).toBe(destination);
    expect(image.width).toBeGreaterThanOrEqual(1000);
  });

  it("returns a vector SVG for print", async () => {
    const svg = await campaignQrSvg(destination);
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
  });
});
