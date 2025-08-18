import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Event } from "proto/events_pb";
import { useForm } from "react-hook-form";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import { CreateEventData } from "./EventForm";
import EventTimeChanger from "./EventTimeChanger";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    TimePicker: jest.requireActual("@mui/x-date-pickers").DesktopTimePicker,
  };
});

const onValidSubmit = jest.fn();

function TestForm({ event }: { event?: Event.AsObject }) {
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    register,
    formState: { dirtyFields, errors },
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

describe("Event time changer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("should load with all empty values by default", async () => {
    render(<TestForm />, { wrapper });

    expect(
      await screen.findByLabelText(t("communities:start_date")),
    ).toHaveValue("");
    expect(screen.getByLabelText(t("communities:start_time"))).toHaveValue("");
    expect(await screen.findByLabelText(t("communities:end_date"))).toHaveValue(
      "",
    );
    expect(screen.getByLabelText(t("communities:end_time"))).toHaveValue("");
  });

  it("should show proper error and not submit if the start date is null", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();

    const startDateErrorText = screen.queryByTestId("startDate-helper-text");

    expect(startDateErrorText).toBeEmptyDOMElement();
  });

  it("should show proper error and not submit if the start date is in the past", async () => {
    render(<TestForm />, { wrapper });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.clear(startDateField);

    expect(startDateField).toHaveValue("");

    await user.type(startDateField, "07302021");

    expect(startDateField).toHaveValue("07/30/2021");

    const startDateErrorText = await screen.findByTestId(
      "startDate-helper-text",
    );

    expect(startDateErrorText).toHaveTextContent(
      t("communities:past_date_error"),
    );

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();

    const startTimeErrorText = screen.queryByTestId("startTime-helper-text");

    expect(startTimeErrorText).toBeEmptyDOMElement();
  });

  it("should show proper error if startDate is today but startTime is in the past", async () => {
    jest.setSystemTime(new Date("2021-08-01 23:00"));

    render(<TestForm />, { wrapper });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(startDateField, "08012021");

    expect(startDateField).toHaveValue("08/01/2021");

    const startTimeField = await screen.findByLabelText(
      t("communities:start_time"),
    );

    await user.type(startTimeField, "1000 PM");
    expect(startTimeField).toHaveValue("10:00 pm");

    const startTimeErrorText = await screen.findByTestId(
      "startTime-helper-text",
    );

    expect(startTimeErrorText).toHaveTextContent(
      t("communities:past_time_error"),
    );

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should show proper error and not submit if the end date is null", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");

    expect(endDateErrorText).toBeEmptyDOMElement();

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(endDateErrorText).toHaveTextContent(
        t("communities:date_required"),
      ),
    );

    const startDateErrorText = await screen.findByTestId(
      "startDate-helper-text",
    );

    expect(startDateErrorText).toHaveTextContent(
      t("communities:date_required"),
    );

    await user.click(screen.getByTestId("submit"));
  });

  it("should show proper error and not submit if the end date is in the past", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const startDateField = await screen.findByLabelText(
      t("communities:start_date"),
    );

    // both dates are in the past
    await user.type(startDateField, "07302021");

    expect(startDateField).toHaveValue("07/30/2021");

    const startDateErrorText = await screen.findByTestId(
      "startDate-helper-text",
    );

    expect(startDateErrorText).toHaveTextContent(
      t("communities:past_date_error"),
    );

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    await user.type(endDateField, "07302021");

    expect(endDateField).toHaveValue("07/30/2021");

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");

    await waitFor(() =>
      expect(endDateErrorText).toHaveTextContent(
        t("communities:past_date_error"),
      ),
    );
  });

  it("should show proper error if endDate is before startDate", async () => {
    render(<TestForm />, { wrapper });

    const startDateField = await screen.findByLabelText(
      t("communities:start_date"),
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    expect(startDateField).toHaveValue("");

    await user.type(startDateField, "08012021");

    expect(startDateField).toHaveValue("08/01/2021");

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    await user.type(endDateField, "07302021");

    expect(endDateField).toHaveValue("07/30/2021");

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");

    // endDateIsBeforeStartDate
    expect(endDateErrorText).toHaveTextContent(t("communities:end_date_error"));

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should show proper error if endDate is today but endTime is in the past", async () => {
    jest.setSystemTime(new Date("2021-08-01 23:00"));

    render(<TestForm />, { wrapper });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    const startTimeField = await screen.findByLabelText(
      t("communities:start_time"),
    );

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(startDateField, "08012021");

    expect(startDateField).toHaveValue("08/01/2021");

    await user.type(startTimeField, "1000 PM");

    expect(startTimeField).toHaveValue("10:00 pm");

    await user.type(endDateField, "08012021");

    expect(endDateField).toHaveValue("08/01/2021");

    const endDateErrorText = screen.queryByTestId("endDate-helper-text");

    await waitFor(() => expect(endDateErrorText).toBeEmptyDOMElement());

    const endTimeField = await screen.findByLabelText(
      t("communities:end_time"),
    );

    const endTimeErrorText = await screen.findByTestId("endTime-helper-text");

    await user.type(endTimeField, "1005 PM");

    expect(endTimeField).toHaveValue("10:05 pm");

    expect(endTimeErrorText).toHaveTextContent(
      t("communities:past_time_error"),
    );

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should not submit if the end date is before the start date", async () => {
    render(<TestForm />, { wrapper });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(endDateField, "07302021");

    expect(endDateField).toHaveValue("07/30/2021");

    await user.click(screen.getByTestId("submit"));

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");
    expect(endDateErrorText).toBeVisible();

    expect(endDateErrorText).toHaveTextContent(
      t("communities:past_date_error"),
    );

    const endTimeErrorText = await screen.findByTestId("endTime-helper-text");
    expect(endTimeErrorText).toBeEmptyDOMElement();

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should show validation error and not show letters if startTime is in the wrong format", async () => {
    render(<TestForm />, { wrapper });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    // make sure it will be in the future
    await user.type(startDateField, "08022021");

    expect(startDateField).toHaveValue("08/02/2021");

    const startTime = screen.getByLabelText(
      t("communities:start_time"),
    ) as HTMLInputElement;
    // Simulate old browsers which will treat time input type as text
    //(startTime as HTMLInputElement).type = "text";

    await user.clear(startTime);
    await user.type(startTime, "xyz");

    // Only check if manual typing works
    if (startTime.value === "xyz") {
      await user.click(screen.getByTestId("submit"));

      const errorText = await screen.findByTestId("startTime-helper-text");
      expect(errorText).toBeVisible();
      expect(errorText).toHaveTextContent(t("communities:invalid_time"));
    }
  });

  it("should show error if the entered endTime is in the wrong format", async () => {
    render(<TestForm />, { wrapper });

    const endTime = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;
    // Simulate old browsers which will treat time input type as text
    //(endTime as HTMLInputElement).type = "text";

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.clear(endTime);
    await user.type(endTime, "xyz");

    if (endTime.value === "xyz") {
      const errorText = screen.getByTestId("endTime-helper-text");
      expect(errorText).toBeVisible();

      expect(errorText).toHaveTextContent(t("communities:invalid_time"));

      await user.click(screen.getByTestId("submit"));

      expect(onValidSubmit).not.toHaveBeenCalled();
    }
  });

  describe("when editing an existing event", () => {
    it("should only show validation error for dirty fields if editing an existing event", async () => {
      render(<TestForm event={events[0]} />, { wrapper });

      const endDateField = await screen.findByLabelText(
        t("communities:end_date"),
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      await user.clear(endDateField);
      await user.type(endDateField, "07012021");

      await waitFor(() => {
        expect(endDateField).toHaveValue("07/01/2021");
      });

      const endTimeField = await screen.findByLabelText(
        t("communities:end_time"),
      );
      await user.clear(endTimeField);
      await user.type(endTimeField, "1000 PM");

      await waitFor(() => {
        expect(endTimeField).toHaveValue("10:00 pm");
      });

      await user.click(screen.getByTestId("submit"));

      const endTimeErrorText = await screen.findByTestId("endTime-helper-text");
      expect(endTimeErrorText).toBeVisible();
      expect(endTimeErrorText).toHaveTextContent(
        t("communities:past_time_error"),
      );

      const endDateErrorText = await screen.findByTestId("endDate-helper-text");
      expect(endDateErrorText).toBeVisible();
      expect(endDateErrorText).toHaveTextContent(
        t("communities:past_date_error"),
      );

      expect(
        await screen.findByTestId("startDate-helper-text"),
      ).toBeEmptyDOMElement();
      expect(
        await screen.findByTestId("startTime-helper-text"),
      ).toBeEmptyDOMElement();
    });

    it("should submit successfully if no date/time fields are touched even if they are in the past", async () => {
      render(<TestForm event={events[0]} />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      await user.click(await screen.findByTestId("submit"));

      expect(onValidSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the end date/time difference from the start has been changed", () => {
    it("should make user manually fix times when the start date/time updates", async () => {
      render(<TestForm />, { wrapper });

      const startDateField = await screen.findByLabelText(
        t("communities:start_date"),
      );
      const endDateField = await screen.findByLabelText(
        t("communities:end_date"),
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      await user.type(endDateField, "08062021");

      expect(endDateField).toHaveValue("08/06/2021");

      await user.type(startDateField, "08112021");

      expect(startDateField).toHaveValue("08/11/2021");

      expect(endDateField).toHaveValue("08/06/2021");

      const startTime = screen.getByLabelText(t("communities:start_time"));

      await user.type(startTime, "1000 PM");

      expect(startTime).toHaveValue("10:00 pm");

      const endTime = screen.getByLabelText(t("communities:end_time"));

      // Increases time difference between start and end time to 3 hours
      await user.type(endTime, "0300 PM");

      expect(endTime).toHaveValue("03:00 pm");

      await user.type(startTime, "0200 PM");

      expect(startTime).toHaveValue("02:00 pm");
      expect(endTime).toHaveValue("03:00 pm");
    });
  });
});
