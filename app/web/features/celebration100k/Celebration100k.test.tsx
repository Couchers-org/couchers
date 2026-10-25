import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";

import Celebration100k from "./Celebration100k";
import { CELEBRATION_100K_FLAG, CELEBRATION_100K_SEEN_KEY } from "./constants";
import { fetchMemberLocations } from "./mapData";

jest.mock("./mapData", () => ({
  ...jest.requireActual("./mapData"),
  fetchMemberLocations: jest.fn(),
}));

const fetchMemberLocationsMock = fetchMemberLocations as jest.MockedFunction<typeof fetchMemberLocations>;

const t = (key: string) => i18n.t(`dashboard:celebration_100k.${key}`);

function renderCelebration(props: { autoPlay?: boolean } = {}) {
  const { wrapper: enabledWrapper } = getHookWrapperWithClient({ [CELEBRATION_100K_FLAG]: { defaultValue: true } });
  return render(<Celebration100k {...props} />, { wrapper: enabledWrapper });
}

const closeButton = () => screen.queryByRole("button", { name: t("close_button_a11y") });

describe("Celebration100k", () => {
  beforeEach(() => {
    window.localStorage.clear();
    fetchMemberLocationsMock.mockResolvedValue({ features: [] });
  });

  it("shows nothing while the feature flag is off", () => {
    render(<Celebration100k autoPlay />, { wrapper });

    expect(screen.queryByText(t("banner_message"))).not.toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();
  });

  it("plays the celebration on the first visit and remembers it on this device", async () => {
    renderCelebration({ autoPlay: true });

    expect(await screen.findByRole("button", { name: t("close_button_a11y") })).toBeVisible();
    expect(window.localStorage.getItem(CELEBRATION_100K_SEEN_KEY)).toBe("true");
  });

  it("closes with the close button and leaves the banner", async () => {
    const user = userEvent.setup();
    renderCelebration({ autoPlay: true });

    await user.click(await screen.findByRole("button", { name: t("close_button_a11y") }));

    await waitFor(() => expect(closeButton()).not.toBeInTheDocument());
    expect(screen.getByText(t("banner_message"))).toBeVisible();
  });

  it("only shows the banner once this device has seen the celebration", () => {
    window.localStorage.setItem(CELEBRATION_100K_SEEN_KEY, "true");
    renderCelebration({ autoPlay: true });

    expect(screen.getByText(t("banner_message"))).toBeVisible();
    expect(closeButton()).not.toBeInTheDocument();
  });

  it("never plays by itself without autoPlay, but replays from the banner", async () => {
    const user = userEvent.setup();
    renderCelebration();

    expect(screen.getByText(t("banner_message"))).toBeVisible();
    expect(closeButton()).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t("banner_replay_button") }));

    expect(await screen.findByRole("button", { name: t("close_button_a11y") })).toBeVisible();
  });

  it("links the banner to the blog post and the donate page", () => {
    renderCelebration();

    expect(screen.getByRole("link", { name: t("banner_read_more_link") })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: t("help_us_grow_button") })).toHaveAttribute(
      "href",
      "/donate?utm_source=celebration_100k",
    );
  });
});
