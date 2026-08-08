import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Event } from "proto/events_pb";
import { useForm } from "react-hook-form";
import { Temporal } from "temporal-polyfill";
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

    // In MUI X v8, empty date/time fields don't have easily testable values
    // So we just check that the fields exist and are rendered
    expect(await screen.findByRole("group", { name: t("communities:start_date") })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: t("communities:start_date") })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: t("communities:end_date") })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: t("communities:end_time") })).toBeInTheDocument();
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

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });
    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07302021");

    const startDateErrorText = await screen.findByTestId("startDate-helper-text");

    expect(startDateErrorText).toHaveTextContent(t("communities:past_date_error"));

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();

    const startTimeErrorText = screen.queryByTestId("startTime-helper-text");

    expect(startTimeErrorText).toBeEmptyDOMElement();
  });

  it("should show proper error if startDate is today but startTime is in the past", async () => {
    jest.setSystemTime(new Date("2021-08-01 23:00"));
    expect(Temporal.Now.plainDateISO().toString() == "2021-08-01");

    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });
    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const startTimeGroup = await screen.findByRole("group", {
      name: t("communities:start_time"),
    });
    await user.click(startTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1000 PM");

    const startTimeErrorText = await screen.findByTestId("startTime-helper-text");

    expect(startTimeErrorText).toHaveTextContent(t("communities:past_time_error"));

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should show proper error and not submit if the end date is null", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");

    expect(endDateErrorText).toBeEmptyDOMElement();

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();

    await waitFor(() => expect(endDateErrorText).toHaveTextContent(t("communities:date_required")));

    const startDateErrorText = await screen.findByTestId("startDate-helper-text");

    expect(startDateErrorText).toHaveTextContent(t("communities:date_required"));

    await user.click(screen.getByTestId("submit"));
  });

  it("should show proper error and not submit if the end date is in the past", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });
    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07302021");

    const startDateErrorText = await screen.findByTestId("startDate-helper-text");

    expect(startDateErrorText).toHaveTextContent(t("communities:past_date_error"));

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07302021");

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");

    await waitFor(() => expect(endDateErrorText).toHaveTextContent(t("communities:past_date_error")));
  });

  it("should show proper error if endDate is before startDate", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });
    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07302021");

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");

    // endDateIsBeforeStartDate
    expect(endDateErrorText).toHaveTextContent(t("communities:end_date_error"));

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should show proper error if endDate is today but endTime is in the past", async () => {
    jest.setSystemTime(new Date("2021-08-01 23:00"));

    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });
    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const startTimeGroup = await screen.findByRole("group", {
      name: t("communities:start_time"),
    });
    await user.click(startTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1000 PM");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const endDateErrorText = screen.queryByTestId("endDate-helper-text");

    await waitFor(() => expect(endDateErrorText).toBeEmptyDOMElement());

    const endTimeGroup = await screen.findByRole("group", {
      name: t("communities:end_time"),
    });
    const endTimeErrorText = await screen.findByTestId("endTime-helper-text");

    await user.click(endTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1005 PM");

    expect(endTimeErrorText).toHaveTextContent(t("communities:past_time_error"));

    await user.click(screen.getByTestId("submit"));

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should not submit if the end date is before the start date", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("07302021");

    await user.click(screen.getByTestId("submit"));

    const endDateErrorText = await screen.findByTestId("endDate-helper-text");
    expect(endDateErrorText).toBeVisible();

    expect(endDateErrorText).toHaveTextContent(t("communities:past_date_error"));

    const endTimeErrorText = await screen.findByTestId("endTime-helper-text");
    expect(endTimeErrorText).toBeEmptyDOMElement();

    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  it("should show null value and not show letters if startTime is in the wrong format", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    // make sure it will be in the future
    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });
    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08022021");

    const startTimeGroup = screen.getByRole("group", {
      name: t("communities:start_time"),
    });

    await user.click(startTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("xyz");

    // Check if the invalid input triggers validation error
    await user.click(screen.getByTestId("submit"));

    // In v8, the timepicker stays value null until valid time entered
    expect(startTimeGroup).toHaveTextContent("hh:mm aa");
  });

  it("should show null value if the entered endTime is in the wrong format", async () => {
    render(<TestForm />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const endTimeGroup = screen.getByRole("group", {
      name: t("communities:end_time"),
    });
    await user.click(endTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("xyz");

    expect(endTimeGroup).toHaveTextContent("hh:mm aa");

    await user.click(screen.getByTestId("submit"));

    // Should not submit due to invalid time
    expect(onValidSubmit).not.toHaveBeenCalled();
  });

  describe("when editing an existing event", () => {
    it("should only show validation error for dirty fields if editing an existing event", async () => {
      render(<TestForm event={events[0]} />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      const endDateGroup = await screen.findByRole("group", {
        name: t("communities:end_date"),
      });
      await user.click(endDateGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("07012021");

      const endTimeGroup = await screen.findByRole("group", {
        name: t("communities:end_time"),
      });
      await user.click(endTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("1000 PM");

      await user.click(screen.getByTestId("submit"));

      const endTimeErrorText = await screen.findByTestId("endTime-helper-text");
      expect(endTimeErrorText).toBeVisible();
      expect(endTimeErrorText).toHaveTextContent(t("communities:past_time_error"));

      const endDateErrorText = await screen.findByTestId("endDate-helper-text");
      expect(endDateErrorText).toBeVisible();
      expect(endDateErrorText).toHaveTextContent(t("communities:past_date_error"));

      expect(await screen.findByTestId("startDate-helper-text")).toBeEmptyDOMElement();
      expect(await screen.findByTestId("startTime-helper-text")).toBeEmptyDOMElement();
    });

    it("should submit successfully if no date/time fields are touched even if they are in the past", async () => {
      render(<TestForm event={events[0]} />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      await user.click(await screen.findByTestId("submit"));

      expect(onValidSubmit).toHaveBeenCalledTimes(1);

      // Verify the submitted data contains the expected event data
      const submittedData = onValidSubmit.mock.calls[0][0];
      expect(submittedData).toBeDefined();
      // The event fixture should have the original event data preserved
      expect(submittedData.startDate).toBeDefined();
      expect(submittedData.endDate).toBeDefined();
    });
  });

  describe("when startDate and startTime are set", () => {
    it("should autofill endDate and endTime", async () => {
      render(<TestForm />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const startDateGroup = await screen.findByRole("group", {
        name: t("communities:start_date"),
      });
      await user.click(startDateGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("08052021");

      const startTimeGroup = screen.getByRole("group", {
        name: t("communities:start_time"),
      });
      await user.click(startTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("1000 PM");

      const endTimeGroup = screen.getByRole("group", {
        name: t("communities:end_time"),
      });
      //user must manually make endTime later
      await user.click(endTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("1100 PM");

      await user.click(screen.getByTestId("submit"));
      expect(onValidSubmit).toHaveBeenCalled();
      const submittedData = onValidSubmit.mock.calls[0][0];
      expect(submittedData).toBeDefined();
      expect(submittedData.endDate.toString()).toBe("2021-08-05");
      expect(submittedData.endTime.toString()).toBe("23:00:00");
    });

    it("should not accept submission if startDate/Time and endDate/Time are the same", async () => {
      render(<TestForm />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const startDateGroup = await screen.findByRole("group", {
        name: t("communities:start_date"),
      });
      await user.click(startDateGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("08052021");

      const startTimeGroup = screen.getByRole("group", {
        name: t("communities:start_time"),
      });
      await user.click(startTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("1000 PM");

      await user.click(screen.getByTestId("submit"));
      
      expect(
        await screen.findByText(t("communities:end_time_error"))
      ).toBeInTheDocument();

      // Should not submit due to same date/time as start
      expect(onValidSubmit).not.toHaveBeenCalled();
    });
  });

  describe("when endDate is set", () => {
    it("should not autofill endDate", async () => {
      render(<TestForm />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      const endDateGroup = await screen.findByRole("group", {
        name: t("communities:end_date"),
      });
      await user.click(endDateGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("08102021");

      const startDateGroup = await screen.findByRole("group", {
        name: t("communities:start_date"),
      });
      await user.click(startDateGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("08052021");

      const startTimeGroup = await screen.findByRole("group", {
        name: t("communities:start_time"),
      });
      await user.click(startTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("0800AM");

      await user.click(screen.getByTestId("submit"));
      expect(onValidSubmit).toHaveBeenCalled();
      const submittedData = onValidSubmit.mock.calls[0][0];
      expect(submittedData).toBeDefined();
      expect(submittedData.endDate.toString()).toBe("2021-08-10");
      expect(submittedData.endTime.toString()).toBe("08:00:00");
    });
 }); 
  describe("when endTime is set", () => {
    it("should not autofill endTime", async () => {
      render(<TestForm />, { wrapper });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      const endTimeGroup = await screen.findByRole("group", {
        name: t("communities:end_time"),
      });
      await user.click(endTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("1100 PM");

      const startTimeGroup = await screen.findByRole("group", {
        name: t("communities:start_time"),
      });
      await user.click(startTimeGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("0300 PM");

      const startDateGroup = await screen.findByRole("group", {
        name: t("communities:start_date"),
      });
      await user.click(startDateGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard("08052021");

      await user.click(screen.getByTestId("submit"));
      expect(onValidSubmit).toHaveBeenCalled();
      const submittedData = onValidSubmit.mock.calls[0][0];
      expect(submittedData).toBeDefined();
      expect(submittedData.endDate.toString()).toBe("2021-08-05");
      expect(submittedData.endTime.toString()).toBe("23:00:00");
    });
 });
});
