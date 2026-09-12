import { render, screen } from "@testing-library/react";
import { HostRequest } from "proto/requests_pb";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import hostRequest from "test/fixtures/hostRequest";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import UpcomingStayCard from "./UpcomingStayCard";

const { t } = i18n;

const getLiteUserMock = service.user.getLiteUser as jest.Mock;

function stayFrom(fromOffsetDays: number, toOffsetDays: number): HostRequest.AsObject {
  const today = Temporal.Now.plainDateISO();
  return {
    ...hostRequest,
    fromDate: today.add({ days: fromOffsetDays }).toString(),
    toDate: today.add({ days: toOffsetDays }).toString(),
  };
}

describe("UpcomingStayCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10T12:34:56Z"));
    addDefaultUser();
    getLiteUserMock.mockImplementation(getLiteUser);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Stays only carry dates, so they say "Today" rather than "Now" for anything covering today.
  it("shows the today label for a stay that is already underway", () => {
    render(<UpcomingStayCard hostRequest={stayFrom(-2, 2)} />, { wrapper });

    expect(screen.getByText(t("dashboard:today_label"))).toBeVisible();
    expect(screen.queryByText(t("dashboard:now_label"))).not.toBeInTheDocument();
  });

  it("shows the today label for a stay starting today", () => {
    render(<UpcomingStayCard hostRequest={stayFrom(0, 3)} />, { wrapper });

    expect(screen.getByText(t("dashboard:today_label"))).toBeVisible();
    expect(screen.queryByText(t("dashboard:now_label"))).not.toBeInTheDocument();
  });

  it("shows a relative label for a stay starting in a few days", () => {
    render(<UpcomingStayCard hostRequest={stayFrom(2, 5)} />, { wrapper });

    expect(screen.getByText("In 2 days")).toBeVisible();
    expect(screen.queryByText(t("dashboard:today_label"))).not.toBeInTheDocument();
  });
});
