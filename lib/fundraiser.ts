// Trip fundraiser: donors chip in SOL or USDC and appear in the crowd.
// Donations are tracked by hand: check the wallet in an explorer, then add the donor below.

export const FUND = {
  wallet: "D9SUSzFB66kjbd8ykb5jX5TA4c4EZnVWPwB1tupm8U6c", // your Solana address; the "Join the crowd" button stays hidden until this is set
  goalUsd: 6000, // whole trip in USD: flight, visa and stay
  alreadyUsd: 0, // money you actually have for the trip outside the game (savings, pledges); counts toward the board
  from: "BOM", // three letters for the departures board
};

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Donors pick one of these in the donate form; only your words ever appear in the game.
export const DONOR_LINES = [
  "I helped pay for this guy's flight. He'd better post every day.",
  "Funded one aisle seat. Window was extra.",
  "My money is in the crowd now. Literally.",
  "Came for the side events, stayed for the meal deal.",
  "I'm the reason he gets the 6am flight and not the 4am one.",
  "gm from the people who paid for the trip.",
];

export type Donor = {
  handle: string; // X handle without the @
  usd: number; // dollar value at the time they sent it (convert SOL yourself)
  line: number; // index into DONOR_LINES, from their memo
  tx?: string; // transaction signature, for anyone who wants to check
};

// Add each donor here after you see the payment, then redeploy. Memo format: "bp26 @handle L2".
export const DONORS: Donor[] = [];

// Preview data for screenshots (?fund=preview). Never shown on the normal site.
export const PREVIEW_DONORS: Donor[] = [
  { handle: "your_handle", usd: 25, line: 0 },
  { handle: "solana_fren", usd: 50, line: 1 },
  { handle: "gm_builder", usd: 10, line: 2 },
  { handle: "late_bird", usd: 100, line: 4 },
  { handle: "meal_deal_dao", usd: 15, line: 3 },
];

export function solanaPayUrl(currency: "SOL" | "USDC", amount: number, handle: string, line: number) {
  const p = new URLSearchParams({ amount: String(amount), label: "Breakpoint trip", message: "Thanks! You'll show up in the crowd soon.", memo: `bp26 @${handle} L${line}` });
  if (currency === "USDC") p.set("spl-token", USDC_MINT);
  return `solana:${FUND.wallet}?${p.toString()}`;
}
