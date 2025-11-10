// front_end/src/lib/ratios.ts
export type RatiosRow = { label: string; classification?: string; values: Record<string,string> };
export type RatiosResponse = { symbol: string; years: string[]; rows: RatiosRow[]; note?: string };

export async function fetchRatios(symbol: string, period: "year"|"quarter" = "year") {
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const res = await fetch(`${base}/ratios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock_code: symbol, period, lang: "vi", dropna: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<RatiosResponse>;
}