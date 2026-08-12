import { render, screen } from "@testing-library/react";
import { Event } from "proto/events_pb";
import { Temporal } from "temporal-polyfill";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import EventListRow from "./EventListRow";

const { t } = i18n;

const baseEvent = events[0] as unknown as Event.AsObject;

function eventAt(start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime): Event.AsObject {
  return {
    ...baseEvent,
    timezone: start.timeZoneId,
    startTime: { seconds: start.epochMilliseconds / 1000, nanos: 0 },
    endTime: { seconds: end.epochMilliseconds / 1000, nanos: 0 },
  };
}

describe("EventListRow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-05-10T12:34:56Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the today label for an event starting later today", () => {
    const now = Temporal.Now.zonedDateTimeISO();
    // Already finished, but still on today's date, so it is "today" rather than "now".
    const start = now.startOfDay();
    render(<EventListRow event={eventAt(start, start.add({ minutes: 1 }))} />, { wrapper });

    expect(screen.getByText(t("dashboard:today_label"))).toBeVisible();
    expect(screen.queryByText(t("dashboard:now_label"))).not.toBeInTheDocument();
  });

  it("shows the now label while an event is happening", () => {
    const now = Temporal.Now.zonedDateTimeISO();
    render(<EventListRow event={eventAt(now.subtract({ hours: 1 }), now.add({ hours: 1 }))} />, { wrapper });

    expect(screen.getByText(t("dashboard:now_label"))).toBeVisible();
    expect(screen.queryByText(t("dashboard:today_label"))).not.toBeInTheDocument();
  });

  it("shows the month and day for an event on another day", () => {
    const now = Temporal.Now.zonedDateTimeISO();
    const start = now.add({ days: 3 });
    render(<EventListRow event={eventAt(start, start.add({ hours: 1 }))} />, { wrapper });

    expect(screen.getByText(String(start.day))).toBeVisible();
    expect(screen.queryByText(t("dashboard:today_label"))).not.toBeInTheDocument();
    expect(screen.queryByText(t("dashboard:now_label"))).not.toBeInTheDocument();
  });
});
