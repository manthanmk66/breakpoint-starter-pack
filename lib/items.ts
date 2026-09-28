// Starter pack items. x/z = where the gold token floats on the map.
export type Item = {
  place: string;
  item: string;
  line: string;
  icon: IconName;
  ticker: string; // parody token the item becomes once packed
  pitch: string;
  price: number; // listing price in USD
  x: number;
  z: number;
};

export const ICON_PATHS = {
  umbrella: ["M2 12a10 10 0 0 1 20 0Z", "M12 12v7a2 2 0 0 1-4 0", "M12 2v1"],
  card: ["M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z", "M2 10h20", "M6 15h4"],
  sandwich: ["M3 18L12 5l9 13Z", "M5.5 15h13"],
  badge: ["M8 7h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z", "M9 2l3 5 3-5", "M14 13a2 2 0 1 1-4 0a2 2 0 1 1 4 0", "M9 18h6"],
  battery: ["M8 4h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", "M10 2h4", "M9 18h2"],
  chats: ["M3 4h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-4 3v-3H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z", "M16 9h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v3l-4-3h-5a1 1 0 0 1-1-1v-3"],
  pint: ["M6 3h12l-1.5 18h-9Z", "M6.6 8h10.8"],
  shoe: ["M2 16c0-4 1-8 3-9l3 2 3-1 5 5 5 1c1 .3 1 1.5 1 2Z", "M2 16h20v3H2Z"],
  moon: ["M20 15A8 8 0 1 1 9 4a6.5 6.5 0 0 0 11 11Z", "M15 3h4l-4 4h4"],
  walk: ["M15 4a2 2 0 1 1-4 0a2 2 0 1 1 4 0", "M11 21l2-6 3 3v3", "M8 11l3-3 3 2 3 1", "M13 15l-1-6"],
} as const;

export type IconName = keyof typeof ICON_PATHS;

export const ITEMS: Item[] = [
  { place: "Tower Bridge", item: "An umbrella", line: "Landed, took one photo on the bridge, got soaked. It will rain all week.", ticker: "$UMBRLA", pitch: "Backed 1:1 by a real umbrella. The umbrella now lives on the Northern line.", price: 4.2, icon: "umbrella", x: 24, z: 7.2 },
  { place: "Tube station", item: "Contactless card", line: "Tap in, tap out. Said gm to the whole carriage. Nobody said gm back.", ticker: "$TAPIN", pitch: "Your commute, tokenized. TfL still charges full price.", price: 2.9, icon: "card", x: -30, z: 19.5 },
  { place: "Corner shop", item: "The meal deal", line: "Sandwich, crisps, drink. Your entire diet for three days.", ticker: "$MEALDL", pitch: "RWA: Really Wet Asparagus. Yield: one packet of crisps.", price: 3.99, icon: "sandwich", x: -16, z: 24.5 },
  { place: "Olympia London", item: "Your badge", line: "Guard it with your life. Left at the flat by day two.", ticker: "$BADGE", pitch: "Soulbound and non-transferable. Also at the flat.", price: 1, icon: "badge", x: 2, z: 26 },
  { place: "London Eye", item: "20,000 mAh power bank", line: "30-minute ride, zero sockets. Somehow still at 4% by lunch.", ticker: "$MAH", pitch: "Max supply 20,000. Circulating supply: 4%.", price: 20, icon: "battery", x: -12, z: -8 },
  { place: "Shoreditch side event", item: "14 new group chats", line: "All muted. Zero read. One is just the organiser posting the wifi password.", ticker: "$GCHAT", pitch: "14 tokens, 0 holders have read any of them.", price: 0.14, icon: "chats", x: 33, z: -11 },
  { place: "The Red Lion", item: 'The "afterparty"', line: "A pub with a banner on it. Best alpha of the whole week.", ticker: "$PINT", pitch: "Deepest liquidity at Breakpoint. Settles at last orders.", price: 7.5, icon: "pint", x: 18, z: 25.5 },
  { place: "Big Ben", item: "Comfy trainers", line: "27,000 steps. You saw Big Ben at 1am on the walk back.", ticker: "$STEPS", pitch: "Proof of Walk. 27,000 confirmations.", price: 27, icon: "shoe", x: -31, z: -9 },
  { place: "Flat 4B, Zone 3", item: "3 hours of sleep", line: "Could not afford a room with a Shard view. Total sleep: 3 hours. Worth it.", ticker: "$SLEEP", pitch: "Max supply: 3. Heavily shorted.", price: 3, icon: "moon", x: 34, z: 26.5 },
];

// What the crowd says when you walk past or tap them.
export const NPC_LINES = [
  "gm. Are you a founder? Everyone here is a founder.",
  "We're AI agents trading prediction markets on tokenized meal deals. Pre-seed, post-vibes.",
  "Firedancer took three years. This coffee queue is taking longer.",
  "It's not a memecoin, it's a community.",
  "Claimed my SKR airdrop. It covered one Tube fare.",
  "I tokenized my flat. Now I rent it back from 4,000 strangers.",
  "Alpenglow is aiming for 150ms finality. My Tube is 12 minutes late.",
  "xStocks trade 24/7. The pub shuts at eleven.",
  "First Breakpoint? I've been since Lisbon. Yes, that Lisbon.",
  "Stablecoins did $4.7 trillion this year. I did four pints.",
  "Paid $800 for a late bird ticket. The bird was very late.",
  "The banner says Ship More. I shipped one tweet.",
];
