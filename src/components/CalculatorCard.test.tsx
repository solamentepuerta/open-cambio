import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CalculatorCard from "./CalculatorCard";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { RateEntry } from "@/types";

const rates: RateEntry[] = [
  {
    name: "Dólar BCV",
    symbol: "USD",
    rate: 500,
    lastUpdate: "2026-08-01T12:00:00.000Z",
  },
  {
    name: "Euro BCV",
    symbol: "EUR",
    rate: 600,
    lastUpdate: "2026-08-01T12:00:00.000Z",
  },
  {
    name: "USDT",
    symbol: "USDT",
    rate: 650,
    lastUpdate: "2026-08-01T12:00:00.000Z",
  },
];

describe("CalculatorCard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
    useCurrencyStore.setState({
      baseAmount: 1,
      bsAmount: 0,
      lastEdited: "usd",
      selectedRate: "USD",
      historicalRates: null,
      historicalDate: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not overwrite the bolivar value while it is being typed", async () => {
    render(<CalculatorCard rates={rates} />);

    const bsInput = await screen.findByLabelText(/Recibo \(Bs\)/);
    const topInput = screen.getByLabelText(/Tengo \(USD\)/);

    fireEvent.focus(bsInput);
    fireEvent.change(bsInput, { target: { value: "1" } });
    fireEvent.change(bsInput, { target: { value: "12" } });
    fireEvent.change(bsInput, { target: { value: "123" } });

    await waitFor(() => {
      expect((bsInput as HTMLInputElement).value).toBe("123");
      expect((topInput as HTMLInputElement).value).toBe("0.25");
      expect(useCurrencyStore.getState().lastEdited).toBe("bs");
      expect(useCurrencyStore.getState().bsAmount).toBe(123);
    });
  });
});
