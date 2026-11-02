import { cardScrollDistance } from "./FadingScrollTrack";

function trackOfWidth(width: number) {
  const track = document.createElement("div");
  Object.defineProperty(track, "clientWidth", { value: width });
  return track;
}

describe("cardScrollDistance", () => {
  // 220px cards with a 12px gap, as on the dashboard's upcoming stays
  const step = 220 + 12;

  it("scrolls two cards when there's room for them", () => {
    expect(cardScrollDistance(trackOfWidth(700), 220, 12)).toBe(2 * step);
  });

  it("scrolls only one card on a phone, where under two fit, so none are skipped", () => {
    expect(cardScrollDistance(trackOfWidth(328), 220, 12)).toBe(step);
  });

  it("still scrolls one card when not even one fully fits", () => {
    expect(cardScrollDistance(trackOfWidth(150), 220, 12)).toBe(step);
  });
});
