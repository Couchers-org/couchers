import { render, screen } from "@testing-library/react";
import { PublicTrip } from "features/publicTrips/useListPublicTrips";
import { Temporal } from "temporal-polyfill";
import publicTrips from "test/fixtures/publicTrips.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import { DashboardPublicTripCard } from "./DashboardPublicTripCard";

const { t } = i18n;

function tripFrom(fromOffsetDays: number, toOffsetDays: number): PublicTrip {
  const today = Temporal.Now.plainDateISO();
  return {
    ...(publicTrips[0] as unknown as PublicTrip),
    fromDate: today.add({ days: fromOffsetDays }).toString(),
    toDate: today.add({ days: toOffsetDays }).toString(),
  };
}

describe("DashboardPublicTripCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10T12:34:56Z"));
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
  });
});
