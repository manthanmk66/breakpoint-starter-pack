// Brand sponsors get a shop on the map, their name on some of the crowd's tees, and a crowd line.
// The map has 9 shop spots; sponsors fill them in list order, most visible spot first.
// A sponsor only shows on the public site once `live` is true. Before that, preview it for a pitch
// with ?sponsor=<id> (or ?sponsor=all). Colours are stand-ins: swap in the brand's own kit.

export type Sponsor = {
  id: string;
  name: string; // shop sign and tee print
  color: string; // shop walls and sponsored tees
  ink: string; // text on the sign and tees
  line: string; // what people in their tees say
  live: boolean;
};

export const SPONSORS: Sponsor[] = [
  { id: "solanamobile", name: "Solana Mobile", color: "#14151A", ink: "#14F195", line: "Seeker in one pocket, Oyster card in the other.", live: false },
  { id: "phantom", name: "Phantom", color: "#AB9FF2", ink: "#2A2140", line: "Lost my badge. Still got my Phantom seed phrase. Priorities.", live: false },
  { id: "yourbrand", name: "Your Brand", color: "#E3A63B", ink: "#1F2A2E", line: "This shop could be yours. Ask the guy in the Solana tee.", live: false },
];

export function activeSponsors(search: string): Sponsor[] {
  const want = new URLSearchParams(search).get("sponsor");
  return SPONSORS.filter((s) => s.live || want === "all" || want === s.id);
}
