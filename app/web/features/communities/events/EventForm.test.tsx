import { Temporal } from "@js-temporal/polyfill";
import { useMutation } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { server } from "test/restMock";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import EventForm, { CreateEventVariables } from "./EventForm";

const { t } = i18n;

jest.mock("components/MarkdownInput");

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    TimePicker: jest.requireActual("@mui/x-date-pickers").DesktopTimePicker,
  };
});

const serviceFn = jest.fn();
function TestComponent({
  event,
  isEdit = false,
}: {
  event?: Event.AsObject;
  isEdit?: boolean;
}) {
  const { error, mutate, isPending } = useMutation<
    Event.AsObject,
    RpcError,
    CreateEventVariables
  >({
    mutationFn: serviceFn,
  });

  return (
    <EventForm
      error={error}
      event={event}
      mutate={mutate}
      isMutationLoading={isPending}
      title={t("communities:create_an_event")}
      isEdit={isEdit}
    >
      {() => <button type="submit">{t("global:create")}</button>}
    </EventForm>
  );
}

function renderForm(event?: Event.AsObject, isEdit?: boolean) {
  render(<TestComponent event={event} isEdit={isEdit} />, { wrapper });
}

function assertFieldVisibleWithValue(field: HTMLElement, value: string) {
  expect(field).toBeVisible();
  expect(field).toHaveValue(value);
}

describe("Event form", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    serviceFn.mockResolvedValue(1);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render the form correctly", async () => {
    renderForm();

    expect(
      await screen.findByRole("heading", {
        name: t("communities:create_an_event"),
      }),
    ).toBeVisible();
    expect(screen.getByText(t("communities:upload_helper_text"))).toBeVisible();
    // In MUI X v8, empty date/time fields don't have easily testable values
    // So we just check that the fields exist and are rendered
    expect(
      screen.getByRole("group", { name: t("communities:start_date") }),
    ).toHaveTextContent("MM/DD/YYYY");

    expect(
      screen.getByRole("group", { name: t("communities:start_time") }),
    ).toHaveTextContent("hh:mm aa");
    expect(
      screen.getByRole("group", { name: t("communities:end_date") }),
    ).toHaveTextContent("MM/DD/YYYY");
    expect(
      screen.getByRole("group", { name: t("communities:end_time") }),
    ).toHaveTextContent("hh:mm aa");
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:location")),
      "",
    );
    expect(screen.getByLabelText(t("communities:event_details"))).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("global:create") }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", { name: t("communities:event_image_input_alt") }),
    ).toHaveAttribute("src", "/img/imagePlaceholder.svg");
  });

  it("renders the form correctly when passed an event", async () => {
    renderForm(events[0], true);

    assertFieldVisibleWithValue(
      await screen.findByLabelText(t("communities:event_title_label")),
      "Weekly Meetup",
    );

    const startDateGroup = screen.getByRole("group", {
      name: t("communities:start_date"),
    });
    const startTimeGroup = screen.getByRole("group", {
      name: t("communities:start_time"),
    });
    const endDateGroup = screen.getByRole("group", {
      name: t("communities:end_date"),
    });
    const endTimeGroup = screen.getByRole("group", {
      name: t("communities:end_time"),
    });

    expect(startDateGroup).toHaveTextContent("06/29/2021");
    expect(startTimeGroup).toHaveTextContent("02:37 am");
    expect(endDateGroup).toHaveTextContent("06/29/2021");
    expect(endTimeGroup).toHaveTextContent("03:37 am");

    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:location")),
      "Concertgebouw",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:event_details")),
      "*Be there* or be square!",
    );
    expect(
      screen.getByRole("img", { name: t("communities:event_image_input_alt") }),
    ).toHaveAttribute("src", "https://loremflickr.com/500/120/amsterdam");
  });

  it("renders the image input for an event with no photo correctly", async () => {
    renderForm(events[1], true);

    expect(
      await screen.findByRole("img", {
        name: t("communities:event_image_input_alt"),
      }),
    ).toHaveAttribute("src", "/img/imagePlaceholder.svg");
  });

  it("should not submit if the title is missing", async () => {
    renderForm();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await act(async () =>
      user.click(screen.getByRole("button", { name: t("global:create") })),
    );

    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should not submit if location is missing for an event", async () => {
    renderForm();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(
      screen.getByLabelText(t("communities:event_title_label")),
      "Test event",
    );

    await act(async () =>
      user.click(screen.getByRole("button", { name: t("global:create") })),
    );

    expect(
      await screen.findByText(t("communities:location_required")),
    ).toBeVisible();
    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should submit the form successfully if all required fields are filled in", async () => {
    renderForm();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const titleInput = screen.getByLabelText(
      t("communities:event_title_label"),
    ) as HTMLInputElement;

    await user.type(titleInput, "Test event");

    expect(titleInput).toHaveValue("Test event");

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
    await user.keyboard("0100 AM");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const endTimeGroup = screen.getByRole("group", {
      name: t("communities:end_time"),
    });
    await user.click(endTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("0200 AM");

    const locationInput = await screen.getByLabelText(
      t("communities:location"),
    );
    await user.type(locationInput, "tes{enter}");
    expect(locationInput).toHaveValue("tes");
    await user.click(
      await screen.findByText("test city, test county, test country"),
    );

    await user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
      "sick social!",
    );

    await act(async () =>
      user.click(screen.getByRole("button", { name: t("global:create") })),
    );

    expect(serviceFn).toHaveBeenCalledTimes(1);

    // Verify the submitted data contains the expected values
    const submittedData: CreateEventVariables = serviceFn.mock.calls[0][0];
    expect(submittedData.title).toBe("Test event");
    expect(submittedData.location.name).toBe(
      "test city, test county, test country",
    );
    expect(submittedData.content).toBe("sick social!");
    expect(submittedData.startDate).toEqual(
      Temporal.PlainDate.from("2021-08-01"),
    );
    expect(submittedData.startTime).toEqual(Temporal.PlainTime.from("01:00"));
    expect(submittedData.endDate).toEqual(
      Temporal.PlainDate.from("2021-08-01"),
    );
    expect(submittedData.endTime).toEqual(Temporal.PlainTime.from("02:00"));
  });

  it("should show an error alert if the form failed to submit", async () => {
    mockConsoleError();
    const errorMessage = "Error submitting event";
    serviceFn.mockRejectedValue(new Error(errorMessage));

    renderForm();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(
      screen.getByLabelText(t("communities:event_title_label")),
      "Test event",
    );

    expect(
      screen.getByLabelText(t("communities:event_title_label")),
    ).toHaveValue("Test event");

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
    await user.keyboard("0100 AM");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const endTimeGroup = screen.getByRole("group", {
      name: t("communities:end_time"),
    });
    await user.click(endTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("0200 AM");

    const locationInput = (await screen.findByLabelText(
      t("communities:location"),
    )) as HTMLInputElement;

    await user.type(locationInput, "tes{enter}");
    expect(locationInput).toHaveValue("tes");

    await user.click(
      await screen.findByText("test city, test county, test country"),
    );

    await user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
      "sick social!",
    );

    await act(async () =>
      user.click(screen.getByRole("button", { name: t("global:create") })),
    );

    expect(serviceFn).toHaveBeenCalledTimes(1);
    await assertErrorAlert(errorMessage);
  });

  it("should submit an event successfully", async () => {
    renderForm();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const titleInput = screen.getByLabelText(
      t("communities:event_title_label"),
    ) as HTMLInputElement;

    await user.type(titleInput, "Test event");

    expect(titleInput).toHaveValue("Test event");

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
    await user.keyboard("0100 AM");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });
    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    const endTimeGroup = screen.getByRole("group", {
      name: t("communities:end_time"),
    });
    await user.click(endTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("0200 AM");

    await user.type(
      screen.getByLabelText(t("communities:location")),
      "tes{enter}",
    );

    expect(screen.getByLabelText(t("communities:location"))).toHaveValue("tes");

    await user.click(
      await screen.findByText("test city, test county, test country"),
    );

    await user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
      "sick social!",
    );

    jest.setSystemTime(new Date("2021-08-01 00:00"));

    await act(async () =>
      user.click(screen.getByRole("button", { name: t("global:create") })),
    );

    expect(serviceFn).toHaveBeenCalledTimes(1);

    // Verify the submitted data contains the expected values
    const submittedData: CreateEventVariables = serviceFn.mock.calls[0][0];
    expect(submittedData.title).toBe("Test event");
    expect(submittedData.location.name).toBe(
      "test city, test county, test country",
    );
    expect(submittedData.content).toBe("sick social!");
    expect(submittedData.startDate).toEqual(
      Temporal.PlainDate.from("2021-08-01"),
    );
    expect(submittedData.startTime).toEqual(Temporal.PlainTime.from("01:00"));
    expect(submittedData.endDate).toEqual(
      Temporal.PlainDate.from("2021-08-01"),
    );
    expect(submittedData.endTime).toEqual(Temporal.PlainTime.from("02:00"));
  });
});
