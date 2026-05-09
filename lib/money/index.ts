export type Currency = "INR" | "USD" | "CAD" | "EUR" | "GBP";
export type BillingCycle =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "adhoc";

export interface Money {
  amount_minor: bigint;
  currency: Currency;
}

const MINOR_UNITS_PER_MAJOR: Record<Currency, bigint> = {
  INR: 100n,
  USD: 100n,
  CAD: 100n,
  EUR: 100n,
  GBP: 100n,
};

const CURRENCY_SYMBOL: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  CAD: "CA$",
  EUR: "€",
  GBP: "£",
};

const ANNUAL_MULTIPLIER: Record<BillingCycle, bigint> = {
  weekly: 52n,
  monthly: 12n,
  quarterly: 4n,
  yearly: 1n,
  adhoc: 1n,
};

export function money(amount_minor: bigint, currency: Currency): Money {
  return { amount_minor, currency };
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);

  return money(a.amount_minor + b.amount_minor, a.currency);
}

export function multiply(m: Money, factor: bigint): Money {
  return money(m.amount_minor * factor, m.currency);
}

export function annualized(m: Money, cycle: BillingCycle): Money {
  return multiply(m, ANNUAL_MULTIPLIER[cycle]);
}

export function formatMoney(m: Money): string {
  const sign = m.amount_minor < 0n ? "-" : "";
  const absoluteMinor = m.amount_minor < 0n ? -m.amount_minor : m.amount_minor;
  const divisor = MINOR_UNITS_PER_MAJOR[m.currency];
  const major = absoluteMinor / divisor;
  const minor = absoluteMinor % divisor;
  const groupedMajor =
    m.currency === "INR"
      ? formatIndianGrouping(major.toString())
      : formatWesternGrouping(major.toString());

  return `${sign}${CURRENCY_SYMBOL[m.currency]}${groupedMajor}.${minor
    .toString()
    .padStart(2, "0")}`;
}

export function parseMoney(display: string, currency: Currency): Money {
  const normalized = display.replace(/[^\d.-]/g, "");
  const [majorRaw = "0", minorRaw = ""] = normalized.split(".");
  const isNegative = majorRaw.startsWith("-");
  const majorDigits = majorRaw.replace("-", "") || "0";
  const minorDigits = minorRaw.padEnd(2, "0").slice(0, 2);
  const absoluteMinor =
    BigInt(majorDigits) * MINOR_UNITS_PER_MAJOR[currency] + BigInt(minorDigits);

  return money(isNegative ? -absoluteMinor : absoluteMinor, currency);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot combine ${a.currency} with ${b.currency}.`);
  }
}

function formatIndianGrouping(value: string): string {
  if (value.length <= 3) {
    return value;
  }

  const lastThree = value.slice(-3);
  const leading = value.slice(0, -3);
  const groups: string[] = [];

  for (let index = leading.length; index > 0; index -= 2) {
    groups.unshift(leading.slice(Math.max(0, index - 2), index));
  }

  return `${groups.join(",")},${lastThree}`;
}

function formatWesternGrouping(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
