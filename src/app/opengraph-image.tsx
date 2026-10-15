import { ImageResponse } from "next/og";

export const alt = "Ramadù Polo Tecnico — iniziativa studentesca indipendente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0a101c",
        color: "#f7f8fa",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -140,
          top: -210,
          width: 650,
          height: 650,
          borderRadius: "50%",
          border: "1px solid rgba(120,169,255,.23)",
          boxShadow: "0 0 0 55px rgba(120,169,255,.035),0 0 0 120px rgba(120,169,255,.025)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#c8d7ee", fontSize: 18, letterSpacing: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 800, color: "#f7f8fa" }}>
          R<span style={{ color: "#78a9ff" }}>.</span>
        </span>
        <span>RAMADÙ　/　POLO TECNICO</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            lineHeight: 1.03,
            fontWeight: 700,
            letterSpacing: -4,
          }}
        >
          <span>Il cambiamento</span>
          <span style={{ color: "#78a9ff", fontFamily: "Georgia, serif", fontWeight: 400, fontStyle: "italic" }}>
            inizia da noi.
          </span>
        </div>
        <div style={{ marginTop: 28, color: "#9caabd", fontSize: 22 }}>
          Due studenti. Idee concrete. Una scuola da costruire insieme.
        </div>
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", color: "#8391a5", fontSize: 14, letterSpacing: 2 }}
      >
        <span>INIZIATIVA STUDENTESCA INDIPENDENTE</span>
        <span>LT · ITALIA</span>
      </div>
    </div>,
    size,
  );
}
