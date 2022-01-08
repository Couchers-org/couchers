import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Event } from "proto/events_pb";
import { useForm } from "react-hook-form";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";

import {
  END_DATE,
  END_TIME,
  END_TIME_ERROR,
  INVALID_TIME,
  PAST_DATE_ERROR,
  PAST_TIME_ERROR,
  START_DATE,
  START_TIME,
} from "./constants";
import { CreateEventData } from "./EventForm";
import EventTimeChanger from "./EventTimeChanger";

const onValidSubmit = jest.fn();

function TestForm({ event }: { event?: Event.AsObject }) {
  const {
    control,
    errors,
    handleSubmit,
    getValues,
    setValue,
    register,
    formState: { dirtyFields },
  } = useForm<CreateEventData>();

  return (
    <form onSubmit={handleSubmit(onValidSubmit)}>
      <EventTimeChanger
        control={control}
        errors={errors}
        event={event}
        getValues={getValues}
        setValue={setValue}
        register={register}
        dirtyFields={dirtyFields}
      />
      <button data-testid="submit" type="submit">
        Submit
      </button>
    </form>
  );
}

beforeEach(() => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2021-08-01 00:00"));
});

afterEach(() => {
  jest.useRealTimers();
});

it("should load with the start/end date adjusted to the next hour by default", async () => {
  render(<TestForm />, { wrapper });

  expect(await screen.findByLabelText(START_DATE)).toHaveValue("08/01/2021");
  expect(screen.getByLabelText(START_TIME)).toHaveValue("01:00");
  expect(await screen.findByLabelText(END_DATE)).toHaveValue("08/01/2021");
  expect(screen.getByLabelText(END_TIME)).toHaveValue("02:00");
});

// Regression test
it("should load with the start/end date adjusted correctly to the next hour at 11pm by default", async () => {
  jest.setSystemTime(new Date("2021-08-01 23:00"));
  render(<TestForm />, { wrapper });

  expect(await screen.findByLabelText(START_DATE)).toHaveValue("08/02/2021");
  expect(screen.getByLabelText(START_TIME)).toHaveValue("00:00");
  expect(await screen.findByLabelText(END_DATE)).toHaveValue("08/02/2021");
  expect(screen.getByLabelText(END_TIME)).toHaveValue("01:00");
});

it("should not submit if the start date/time is in the past", async () => {
  render(<TestForm />, { wrapper });

  const startDateField = await screen.findByLabelText(START_DATE);
  userEvent.clear(startDateField);
  userEvent.type(startDateField, "07302021");
  userEvent.click(screen.getByTestId("submit"));

  await waitFor(() => {
    const startDateErrorText = document.getElementById("startDate-helper-text");
    expect(startDateErrorText).toBeVisible();
    expect(startDateErrorText).toHaveTextContent(PAST_DATE_ERROR);
  });

  const startTimeErrorText = document.getElementById("startTime-helper-text");
  expect(startTimeErrorText).toBeVisible();
  expect(startTimeErrorText).toHaveTextContent(PAST_TIME_ERROR);
});

it("should not submit if the end date/time is in the past", async () => {
  render(<TestForm />, { wrapper });

  const startDateField = await screen.findByLabelText(START_DATE);
  userEvent.clear(startDateField);
  userEvent.type(startDateField, "07302021");
  const endDateField = await screen.findByLabelText(END_DATE);
  userEvent.clear(endDateField);
  userEvent.type(endDateField, "07302021");
  userEvent.click(screen.getByTestId("submit"));

  await waitFor(() => {
    const endDateErrorText = document.getElementById("endDate-helper-text");
    expect(endDateErrorText).toBeVisible();
    expect(endDateErrorText).toHaveTextContent(PAST_DATE_ERROR);
  });
  const endTimeErrorText = document.getElementById("endTime-helper-text");
  expect(endTimeErrorText).toBeVisible();
  expect(endTimeErrorText).toHaveTextContent(PAST_TIME_ERROR);
});

it("should not submit if the end date is before the start date", async () => {
  render(<TestForm />, { wrapper });

  const endDateField = await screen.findByLabelText(END_DATE);
  userEvent.clear(endDateField);
  userEvent.type(endDateField, "07302021");
  userEvent.click(screen.getByTestId("submit"));

  await waitFor(() => {
    const endDateErrorText = document.getElementById("endDate-helper-text");
    expect(endDateErrorText).toBeVisible();
    expect(endDateErrorText).toHaveTextContent(PAST_DATE_ERROR);
  });
  const endTimeErrorText = document.getElementById("endTime-helper-text");
  expect(endTimeErrorText).toBeVisible();
  expect(endTimeErrorText).toHaveTextContent(END_TIME_ERROR);
});

it.each`
  fieldLabel    | fieldErrorId
  ${START_TIME} | ${"startTime-helper-text"}
  ${END_TIME}   | ${"endTime-helper-text"}
`(
  "should show validation error if the entered $fieldLabel is in the wrong format",
  async ({ fieldLabel, fieldErrorId }) => {
    render(<TestForm />, { wrapper });

    const timeField = await screen.findByLabelText(fieldLabel);
    // Simulate old browsers which will treat time input type as text
    (timeField as HTMLInputElement).type = "text";
    userEvent.clear(timeField);
    userEvent.type(timeField, "xyz");
    userEvent.click(screen.getByTestId("submit"));

    await waitFor(() => {
      const errorText = document.getElementById(fieldErrorId);
      expect(errorText).toBeVisible();
      expect(errorText).toHaveTextContent(INVALID_TIME);
    });
  }
);

describe("when editing an existing event", () => {
  it("should only show validation error for dirty fields if editing an existing event", async () => {
    render(<TestForm event={events[0]} />, { wrapper });

    const endDateField = await screen.findByLabelText(END_DATE);
    userEvent.clear(endDateField);
    userEvent.type(endDateField, "07012021");

    const endTimeField = await screen.findByLabelText(END_TIME);
    userEvent.clear(endTimeField);
    userEvent.type(endTimeField, "0000");
    userEvent.click(screen.getByTestId("submit"));

    await waitFor(() => {
      const endTimeErrorText = document.getElementById("endTime-helper-text");
      expect(endTimeErrorText).toBeVisible();
      expect(endTimeErrorText).toHaveTextContent(PAST_TIME_ERROR);
    });

    const endDateErrorText = document.getElementById("endDate-helper-text");
    expect(endDateErrorText).toBeVisible();
    expect(endDateErrorText).toHaveTextContent(PAST_DATE_ERROR);

    expect(
      document.getElementById("startDate-helper.text")
    ).not.toBeInTheDocument();
    expect(
      document.getElementById("startTime-helper-text")
    ).not.toBeInTheDocument();
  });

  it("should submit successfully if no date/time fields are touched even if they are in the past", async () => {
    render(<TestForm event={events[0]} />, { wrapper });
    userEvent.click(await screen.findByTestId("submit"));

    await waitFor(() => {
      expect(onValidSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

it("should update the end date/time by the previous difference to the start date/time updates", async () => {
  render(<TestForm />, { wrapper });

  const startDateField = await screen.findByLabelText(START_DATE);
  userEvent.clear(startDateField);
  userEvent.type(startDateField, "08152021");

  expect(startDateField).toHaveValue("08/15/2021");
  expect(screen.getByLabelText(END_DATE)).toHaveValue("08/15/2021");

  const startTime = screen.getByLabelText(START_TIME);
  userEvent.clear(startTime);
  userEvent.type(startTime, "0330");

  expect(startTime).toHaveValue("03:30");
  expect(screen.getByLabelText(END_TIME)).toHaveValue("04:30");
});

describe("when the end date/time difference from the start has been changed", () => {
  it("should update the end date/time by this new difference when the start date/time updates", async () => {
    render(<TestForm />, { wrapper });

    const startDateField = await screen.findByLabelText(START_DATE);
    const endDateField = screen.getByLabelText(END_DATE);
    // start date is 1st, so this increases difference between start and end date to 5 days
    userEvent.clear(endDateField);
    userEvent.type(endDateField, "08062021");

    userEvent.clear(startDateField);
    userEvent.type(startDateField, "08112021");

    expect(startDateField).toHaveValue("08/11/2021");
    expect(endDateField).toHaveValue("08/16/2021");

    const startTime = screen.getByLabelText(START_TIME);
    userEvent.clear(startTime);
    // Reset time first since I can't get timezone mock and fake timer working together...
    userEvent.type(startTime, "0000");
    const endTime = screen.getByLabelText(END_TIME);
    userEvent.clear(endTime);
    // Increases time difference between start and end time to 3 hours
    userEvent.type(endTime, "0300");
    userEvent.clear(startTime);
    userEvent.type(startTime, "0200");

    expect(startTime).toHaveValue("02:00");
    expect(endTime).toHaveValue("05:00");
  });
});
