import { describe, expect, it } from "vitest";
import {
  add,
  annualized,
  formatMoney,
  money,
  parseMoney,
} from "../../lib/money";

describe("Money", () => {
  it("formats INR with lakh and crore grouping", () => {
    expect(formatMoney(money(150000000n, "INR"))).toBe("₹15,00,000.00");
    expect(formatMoney(money(12345678900n, "INR"))).toBe("₹12,34,56,789.00");
  });

  it("formats supported non-INR currencies with western grouping", () => {
    expect(formatMoney(money(150000000n, "USD"))).toBe("$1,500,000.00");
    expect(formatMoney(money(150000000n, "CAD"))).toBe("CA$1,500,000.00");
    expect(formatMoney(money(150000000n, "EUR"))).toBe("€1,500,000.00");
    expect(formatMoney(money(150000000n, "GBP"))).toBe("£1,500,000.00");
  });

  it("adds money only when currencies match", () => {
    expect(add(money(1000n, "INR"), money(500n, "INR"))).toEqual(
      money(1500n, "INR"),
    );
    expect(() => add(money(1000n, "INR"), money(500n, "USD"))).toThrow();
  });

  it("parses formatted display strings to minor units", () => {
    expect(parseMoney("₹1,500.50", "INR")).toEqual(money(150050n, "INR"));
    expect(parseMoney("CA$1,500.50", "CAD")).toEqual(money(150050n, "CAD"));
  });

  it("annualizes known billing cycles", () => {
    expect(annualized(money(10000n, "INR"), "monthly")).toEqual(
      money(120000n, "INR"),
    );
  });
});
