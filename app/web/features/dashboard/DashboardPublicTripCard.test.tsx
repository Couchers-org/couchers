import { render, screen } from "@testing-library/react";
import { PublicTrip } from "features/publicTrips/useListPublicTrips";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import community from "test/fixtures/community.json";
import publicTrips from "test/fixtures/publicTrips";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import { DashboardPublicTripCard } from "./DashboardPublicTripCard";

const { t } = i18n;

const getCommunityMock = service.communities.getCommunity as jest.MockedFunction<
  typeof service.communities.getCommunity
>;

function tripFrom(fromOffsetDays: number, toOffsetDays: number): PublicTrip {
  const today = Temporal.Now.plainDateISO();
  return {
    ...publicTrips[0],
    fromDate: today.add({ days: fromOffsetDays }).toString(),
    toDate: today.add({ days: toOffsetDays }).toString(),
  };
}

describe("DashboardPublicTripCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10T12:34:56Z"));
    getCommunityMock.mockResolvedValue(community);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The dashboard renders the card without isOwnTrip; the community overview passes it.
  describe.each([
    ["on the dashboard", {}],
    ["in the community overview", { isOwnTrip: true }],
  ])("%s", (_name, modeProps) => {
    // Trips only carry dates, so they say "Today" rather than "Now" for anything covering today.
    it("shows the today label for a trip that is already underway", () => {
      render(<DashboardPublicTripCard trip={tripFrom(-2, 2)} locale="en" {...modeProps} />, { wrapper });

      expect(screen.getByText(t("dashboard:today_label"))).toBeVisible();
      expect(screen.queryByText(t("dashboard:now_label"))).not.toBeInTheDocument();
    });

    it("shows the today label for a trip starting today", () => {
      render(<DashboardPublicTripCard trip={tripFrom(0, 5)} locale="en" {...modeProps} />, { wrapper });

      expect(screen.getByText(t("dashboard:today_label"))).toBeVisible();
      expect(screen.queryByText(t("dashboard:now_label"))).not.toBeInTheDocument();
    });

    it("shows the tomorrow label for a trip starting tomorrow", () => {
      render(<DashboardPublicTripCard trip={tripFrom(1, 5)} locale="en" {...modeProps} />, { wrapper });

      expect(screen.getByText("Tomorrow")).toBeVisible();
    });

    it("shows no chip for a trip further in the future", () => {
      render(<DashboardPublicTripCard trip={tripFrom(9, 12)} locale="en" {...modeProps} />, { wrapper });

      expect(screen.queryByText(t("dashboard:today_label"))).not.toBeInTheDocument();
      expect(screen.queryByText("Tomorrow")).not.toBeInTheDocument();
    });

    // "today" is mocked to 2021-05-10. The \s in these matchers keeps them
    // working whichever space ICU puts either side of the dash (thin today).
    it("shows the trip's date range, naming the month once when it doesn't change", () => {
      render(<DashboardPublicTripCard trip={tripFrom(9, 12)} locale="en" {...modeProps} />, { wrapper });

      expect(screen.getByText(/^19–22 May 2021$/)).toBeVisible();
    });

    it("names both months in the date range when the trip spans a month boundary", () => {
      render(<DashboardPublicTripCard trip={tripFrom(20, 30)} locale="en" {...modeProps} />, { wrapper });

      expect(screen.getByText(/^30 May\s–\s9 Jun 2021$/)).toBeVisible();
    });
  });
});
