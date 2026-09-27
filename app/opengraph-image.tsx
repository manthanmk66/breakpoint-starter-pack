import { ImageResponse } from "next/og";
import { ITEMS } from "@/lib/items";

export const alt = "Breakpoint London Starter Pack: walk London, tokenize everything.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Unbounded to match the in-game title. Satori needs TTF, which Google serves to non-browser clients.
async function display(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Unbounded:wght@800")).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null; // offline build: fall back to the default font
  }
}

export default async function OpengraphImage() {
  const font = await display();
  const title = font ? { fontFamily: "Unbounded", fontWeight: 800, letterSpacing: -2 } : { fontWeight: 800 };
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#E9E6DF", color: "#1F2A2E", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "#5B6A6E" }}>BREAKPOINT 2026 · OLYMPIA LONDON · 15–17 NOV</div>
          <div style={{ ...title, fontSize: 80, lineHeight: 1.05, marginTop: 20, maxWidth: 1000 }}>Breakpoint London Starter Pack</div>
          <div style={{ fontSize: 32, color: "#5B6A6E", marginTop: 20 }}>Walk London. Pack 9 things. Tokenize all of them.</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {ITEMS.map((s) => (
            <div key={s.ticker} style={{ display: "flex", background: "#fff", borderRadius: 999, padding: "10px 20px", fontSize: 26, fontWeight: 700, color: "#7A5310", border: "3px solid #E3A63B" }}>{s.ticker}</div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Unbounded", data: font, weight: 800, style: "normal" }] : [] },
  );
}
