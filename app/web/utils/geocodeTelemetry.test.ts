import { renderHook } from "@testing-library/react";
import { logEvent } from "features/analytics";
import { LngLat } from "maplibre-gl";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import type { GeocodeProvider } from "utils/geocode";
import type { GeocodeResult } from "utils/hooks";

import { useLocationSearchSession } from "./geocodeTelemetry";

type SessionProps = {
  provider: GeocodeProvider;
  results: GeocodeResult[] | undefined;
  error: string | undefined;
  isProviderUnavailable: boolean;
};

jest.mock("features/analytics", () => ({ logEvent: jest.fn() }));
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

const place = (simplifiedName: string, id?: string): GeocodeResult => ({
  id,
  name: simplifiedName,
  simplifiedName,
  location: new LngLat(0, 0),
  bbox: [0, 0, 0, 0],
});

const paris = place("Paris, France", "whosonfirst:locality:1");
const parisTexas = place("Paris, TX, United States", "whosonfirst:locality:2");

const initialProps: SessionProps = {
  provider: "pelias",
  results: undefined,
  error: undefined,
  isProviderUnavailable: false,
};

function renderSession(props: SessionProps = initialProps, sessionWrapper = wrapper) {
  return renderHook((p: SessionProps) => useLocationSearchSession({ surface: "hero-search", ...p }), {
    initialProps: props,
    wrapper: sessionWrapper,
  });
}

const sessionEvents = () => mockLogEvent.mock.calls.filter(([tag]) => tag === "location_autocomplete.session");

describe("useLocationSearchSession", () => {
  afterEach(() => {
    mockLogEvent.mockClear();
  });

  it("logs a selection with the counts and the rank of the chosen result", () => {
    const { result, rerender } = renderSession();

    result.current.onInput("P");
    result.current.onInput("Pa");
    result.current.onInput("Par ");
    rerender({ ...initialProps, results: [] });
    rerender({ ...initialProps, results: [paris, parisTexas] });
    result.current.onSelect(parisTexas);

    expect(sessionEvents()).toEqual([
      [
        "location_autocomplete.session",
        expect.objectContaining({
          surface: "hero-search",
          provider: "pelias",
          mode: "typeahead",
          outcome: "selected",
          keystrokes: 3,
          final_query_length: 3,
          results_shown: 2,
          empty_results_seen: 1,
          errors_seen: 0,
          selected_rank: 1,
          result_count: 2,
        }),
        expect.any(Number),
      ],
    ]);
  });

  it("counts errors and reports submit mode during an outage", () => {
    const { result, rerender } = renderSession();

    result.current.onInput("Pa");
    rerender({ ...initialProps, provider: "nominatim" });
    rerender({ ...initialProps, provider: "nominatim", error: "boom" });
    result.current.onClear();

    expect(sessionEvents()).toEqual([
      [
        "location_autocomplete.session",
        expect.objectContaining({ mode: "submit", outcome: "cleared", errors_seen: 1 }),
        expect.any(Number),
      ],
    ]);
  });

  it("logs an abandoned session on unmount after typing without selecting", () => {
    const { result, unmount } = renderSession();

    result.current.onInput("Pa");
    unmount();

    expect(sessionEvents()).toEqual([
      ["location_autocomplete.session", expect.objectContaining({ outcome: "abandoned" }), expect.any(Number)],
    ]);
  });

  it("logs a session that was open when the page is unloaded", () => {
    const { result } = renderSession();

    result.current.onInput("Pa");
    window.dispatchEvent(new Event("pagehide"));

    expect(sessionEvents()).toEqual([
      ["location_autocomplete.session", expect.objectContaining({ outcome: "left_page" }), expect.any(Number)],
    ]);
  });

  it("logs nothing when the widget was never used", () => {
    const { result, unmount } = renderSession();

    result.current.onClear();
    unmount();

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it("logs a re-selection when the user edits again right after choosing", () => {
    const { result } = renderSession({ ...initialProps, results: [paris] });

    result.current.onInput("Pa");
    result.current.onSelect(paris);
    result.current.onInput("Paris, Franc");

    expect(mockLogEvent).toHaveBeenCalledWith(
      "location_autocomplete.reselected",
      { surface: "hero-search", provider: "pelias" },
      expect.any(Number),
    );
  });

  it("logs nothing when the geocode_telemetry_enabled kill switch is off", () => {
    const { wrapper: disabledWrapper } = getHookWrapperWithClient({
      geocode_telemetry_enabled: { defaultValue: false },
    });
    const { result } = renderSession({ ...initialProps, results: [paris] }, disabledWrapper);

    result.current.onInput("Pa");
    result.current.onSelect(paris);

    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});
