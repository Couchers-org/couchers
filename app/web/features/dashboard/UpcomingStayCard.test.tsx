import { render, screen } from "@testing-library/react";
import { HostRequest } from "proto/requests_pb";
import { service } from "service";
import hostRequest from "test/fixtures/hostRequest";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import UpcomingStayCard from "./UpcomingStayCard";

const { t } = i18n;

const getLiteUserMock = service.user.getLiteUser as jest.Mock;

function stay(fromDate: string, toDate: string, timezone: string): HostRequest.AsObject {
  return { ...hostRequest, fromDate, toDate, timezone };
}

describe("UpcomingStayCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    addDefaultUser();
    getLiteUserMock.mockImplementation(getLiteUser);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the now label for a stay that is underway", () => {
    jest.setSystemTime(new Date("2000-01-01T12:00:00Z"));
    render(<UpcomingStayCard hostRequest={stay("2000-01-01", "2000-01-02", "Etc/UTC")} />, { wrapper });

    expect(screen.getByText(t("dashboard:happening_now_pill"))).toBeVisible();
  });

  it("shows the coming soon label for a stay starting within 24 hours", () => {
    jest.setSystemTime(new Date("2000-01-01T12:00:00Z"));
    render(<UpcomingStayCard hostRequest={stay("2000-01-02", "2000-01-03", "Etc/UTC")} />, { wrapper });

    expect(screen.getByText(t("dashboard:happening_soon_pill"))).toBeVisible();
  });

  it("shows no label for a stay starting more than 24 hours away", () => {
    jest.setSystemTime(new Date("2000-01-01T12:00:00Z"));
    render(<UpcomingStayCard hostRequest={stay("2000-01-03", "2000-01-05", "Etc/UTC")} />, { wrapper });

    expect(screen.queryByText(t("dashboard:happening_soon_pill"))).not.toBeInTheDocument();
    expect(screen.queryByText(t("dashboard:happening_now_pill"))).not.toBeInTheDocument();
  });

  it("judges the start in the stay's timezone", () => {
    jest.setSystemTime(new Date("2000-01-01T00:00:00Z"));
    // 2000-01-01 has already started in Paris, but not yet in New York.
    const { unmount } = render(<UpcomingStayCard hostRequest={stay("2000-01-01", "2000-01-02", "Europe/Paris")} />, {
      wrapper,
    });
    expect(screen.getByText(t("dashboard:happening_now_pill"))).toBeVisible();
    unmount();

    render(<UpcomingStayCard hostRequest={stay("2000-01-01", "2000-01-02", "America/New_York")} />, { wrapper });
    expect(screen.getByText(t("dashboard:happening_soon_pill"))).toBeVisible();
  });
});
