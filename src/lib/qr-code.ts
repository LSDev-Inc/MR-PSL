import QRCode from "qrcode";

const options = {
  errorCorrectionLevel: "H" as const,
  margin: 4,
  width: 1200,
  color: { dark: "#080B12", light: "#FFFFFF" },
};

export function campaignQrSvg(target: string) {
  return QRCode.toString(target, { ...options, type: "svg" });
}

export function campaignQrPng(target: string) {
  return QRCode.toBuffer(target, { ...options, type: "png" });
}
