"use client";

import { useEffect, useRef, useState } from "react";
import { DONOR_LINES, FUND, solanaPayUrl } from "@/lib/fundraiser";

const HANDLE = /^[A-Za-z0-9_]{1,15}$/; // X's handle rules

export default function Donate({ onClose }: { onClose: () => void }) {
  const [handle, setHandle] = useState("");
  const [line, setLine] = useState(0);
  const [currency, setCurrency] = useState<"USDC" | "SOL">("USDC");
  const [amount, setAmount] = useState("10");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  const clean = handle.replace(/^@/, "").trim();
  const value = Number(amount);
  const ready = HANDLE.test(clean) && value > 0 && !!FUND.wallet;
  const url = ready ? solanaPayUrl(currency, value, clean, line) : "";
  const memo = `bp26 @${clean || "you"} L${line}`;

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // QR for desktop visitors paying from a phone wallet
  useEffect(() => {
    if (!url) { setQr(""); return; }
    let live = true;
    import("qrcode-generator").then(({ default: qrcode }) => {
      const q = qrcode(0, "M"); q.addData(url); q.make();
      if (live) setQr(q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
    });
    return () => { live = false; };
  }, [url]);

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(""), 1500); });
  };

  return (
    <section className="final donate" role="dialog" aria-modal="true" aria-labelledby="donate-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="donate-inner">
        <p className="eyebrow">Trip to Breakpoint · {FUND.from} → LDN</p>
        <h2 id="donate-title">Put yourself in the crowd</h2>
        <p className="line">I won my Breakpoint ticket, but I still have to get to London. Send any amount of SOL or USDC and you&apos;ll stand in this London with your @ on your tee, saying the line you pick.</p>

        <label className="field">Your X handle
          <input ref={firstRef} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle" maxLength={16} autoComplete="off" spellCheck={false} />
        </label>

        <label className="field">What you say in the crowd
          <select value={line} onChange={(e) => setLine(Number(e.target.value))}>
            {DONOR_LINES.map((l, i) => <option key={l} value={i}>{l}</option>)}
          </select>
        </label>

        <div className="field">Amount
          <div className="amount">
            <input type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
            <div className="seg" role="group" aria-label="Currency">
              {(["USDC", "SOL"] as const).map((c) => (
                <button key={c} type="button" className={c === currency ? "on" : ""} aria-pressed={c === currency} onClick={() => setCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {ready ? (
          <div className="pay">
            <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} aria-label="Solana Pay QR code" role="img" />
            <div className="pay-side">
              <a className="btn primary" href={url}>Open in wallet</a>
              <p className="fine">On a computer, scan the code with Phantom or Solflare.</p>
              <p className="fine">Sending by hand? Pay <button type="button" className="link" onClick={() => copy(FUND.wallet, "addr")}>{copied === "addr" ? "copied" : "this address"}</button> and put <button type="button" className="link" onClick={() => copy(memo, "memo")}>{copied === "memo" ? "copied" : memo}</button> in the memo.</p>
            </div>
          </div>
        ) : (
          <p className="fine">{FUND.wallet ? "Add your handle and an amount to get the payment code." : "Donations aren't open yet."}</p>
        )}

        <p className="fine">I add people to the crowd by hand, so it can take a little while. This is a gift toward my trip, not an investment: there's no token and nothing to claim.</p>
        <div className="final-btns"><button className="btn ghost" type="button" onClick={onClose}>Back to London</button></div>
      </div>
    </section>
  );
}
