import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { useMutation } from "react-query";
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
function TestComponent({ event }: { event?: Event.AsObject }) {
  const { error, mutate, isLoading } = useMutation<
    Event.AsObject,
    RpcError,
    CreateEventVariables
  >(serviceFn);

  return (
    <EventForm
      error={error}
      event={event}
      mutate={mutate}
      isMutationLoading={isLoading}
      title={t("communities:create_an_event")}
    >
      {() => <button type="submit">{t("global:create")}</button>}
    </EventForm>
  );
}

function renderForm(event?: Event.AsObject) {
  render(<TestComponent event={event} />, { wrapper });
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
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_date")),
      "",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_time")),
      "",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_date")),
      "",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_time")),
      "",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:location")),
      "",
    );
    expect(screen.getByText(t("communities:virtual_event"))).toBeVisible();
    expect(
      screen.getByLabelText(t("communities:virtual_event")),
    ).not.toBeChecked();
    expect(screen.getByLabelText(t("communities:event_details"))).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("global:create") }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", { name: t("communities:event_image_input_alt") }),
    ).toHaveAttribute("src", "/img/imagePlaceholder.svg");
  });

  it("renders the form correctly when passed an event", async () => {
    renderForm(events[0]);

    assertFieldVisibleWithValue(
      await screen.findByLabelText(t("global:title")),
      "Weekly Meetup",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_date")),
      "06/29/2021",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_time")),
      "02:37 AM",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_date")),
      "06/29/2021",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_time")),
      "03:37 AM",
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:location")),
      "Concertgebouw",
    );
    expect(
      screen.getByLabelText(t("communities:virtual_event")),
    ).not.toBeChecked();
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:event_details")),
      "*Be there* or be square!",
    );
    expect(
      screen.getByRole("img", { name: t("communities:event_image_input_alt") }),
    ).toHaveAttribute("src", "https://loremflickr.com/500/120/amsterdam");
  });

  it("renders the image input for an event with no photo correctly", async () => {
    renderForm(events[2]);

    expect(
      await screen.findByRole("img", {
        name: t("communities:event_image_input_alt"),
      }),
    ).toHaveAttribute("src", "/img/imagePlaceholder.svg");
  });

  it("should hide the location field when the virtual event checkbox is ticked", async () => {
    renderForm();

    const user = userEvent.setup();

    const virtualEventCheckbox = screen.getByLabelText(
      t("communities:virtual_event"),
    );

    user.click(virtualEventCheckbox);

    await waitFor(() =>
      expect(
        screen.getByLabelText(t("communities:virtual_event")),
      ).toBeChecked(),
    );
    expect(screen.getByLabelText(t("communities:event_link"))).toBeVisible();
    expect(
      screen.queryByLabelText(t("communities:location")),
    ).not.toBeInTheDocument();
  });

  it("should not submit if the title is missing", async () => {
    renderForm();

    const user = userEvent.setup();

    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(() => {
      expect(serviceFn).not.toHaveBeenCalled();
    });
  });

  it("should not submit if location is missing for an offline event", async () => {
    renderForm();

    const user = userEvent.setup();

    user.type(screen.getByLabelText(t("global:title")), "Test event");

    user.click(screen.getByRole("button", { name: t("global:create") }));

    expect(
      await screen.findByText(t("communities:location_required")),
    ).toBeVisible();
    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should not submit if an event meeting link is missing for an online event", async () => {
    renderForm();

    const user = userEvent.setup();

    user.type(screen.getByLabelText(t("global:title")), "Test event");

    const virtualEventCheckbox = screen.getByLabelText(
      t("communities:virtual_event"),
    ) as HTMLInputElement;

    user.click(virtualEventCheckbox);

    await waitFor(() => {
      expect(virtualEventCheckbox.checked).toBe(true);
    });
    user.click(screen.getByRole("button", { name: t("global:create") }));

    const linkRequiredHelperText = await screen.findByText(
      t("communities:link_required"),
    );

    await waitFor(async () => expect(linkRequiredHelperText).toBeVisible());

    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should submit the form successfully if all required fields are filled in", async () => {
    renderForm();

    const user = userEvent.setup();

    const titleInput = screen.getByLabelText(
      t("global:title"),
    ) as HTMLInputElement;

    // @TODO These should be awaited, but it times out with this component. Try again after upgrading jest and mui x-datepickers maybe?

    user.type(titleInput, "Test event");

    await waitFor(() => {
      expect(titleInput).toHaveValue("Test event");
    });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    user.type(startTimeField, "0100 AM");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("01:00 AM");
    });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    user.type(endDateField, "08012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("08/01/2021");
    });

    const endTimeField = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;

    user.type(endTimeField, "0200 AM");

    await waitFor(() => expect(endTimeField).toHaveValue("02:00 AM"));

    const virtualEventCheckbox = screen.getByLabelText(
      t("communities:virtual_event"),
    ) as HTMLInputElement;

    user.click(virtualEventCheckbox);

    await waitFor(() => {
      expect(virtualEventCheckbox.checked).toBe(true);
    });

    const eventLinkInput = await screen.findByLabelText(
      t("communities:event_link"),
    );

    user.type(eventLinkInput, "https://couchers.org/social");

    await waitFor(
      () => expect(eventLinkInput).toHaveValue("https://couchers.org/social"),
      { timeout: 5000 },
    );

    user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    await waitFor(() => {
      expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
        "sick social!",
      );
    });

    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(() => {
      expect(serviceFn).toHaveBeenCalledTimes(1);
    });
  });

  it("should show an error alert if the form failed to submit", async () => {
    mockConsoleError();
    const errorMessage = "Error submitting event";
    serviceFn.mockRejectedValue(new Error(errorMessage));

    renderForm();

    const user = userEvent.setup();

    // @TODO These should be awaited, but it times out with this component. Try again after upgrading jest and mui x-datepickers maybe?

    user.type(screen.getByLabelText(t("global:title")), "Test event");

    await waitFor(() => {
      expect(screen.getByLabelText(t("global:title"))).toHaveValue(
        "Test event",
      );
    });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    user.type(startTimeField, "0100 AM");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("01:00 AM");
    });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    user.type(endDateField, "08012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("08/01/2021");
    });

    const endTimeField = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;

    user.type(endTimeField, "0200 AM");

    await waitFor(() => expect(endTimeField).toHaveValue("02:00 AM"));

    user.click(screen.getByLabelText(t("communities:virtual_event")));

    const eventLinkInput = (await screen.findByLabelText(
      t("communities:event_link"),
    )) as HTMLInputElement;

    user.type(eventLinkInput, "https://couchers.org/social");

    await waitFor(
      () => {
        expect(eventLinkInput).toHaveValue("https://couchers.org/social");
      },
      { timeout: 5000 },
    );

    user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    await waitFor(() => {
      expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
        "sick social!",
      );
    });

    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(() => {
      expect(serviceFn).toHaveBeenCalledTimes(1);
    });
    await assertErrorAlert(errorMessage);
  });

  it("should submit an offline event successfully", async () => {
    renderForm();

    const user = userEvent.setup();

    const titleInput = screen.getByLabelText(
      t("global:title"),
    ) as HTMLInputElement;

    user.type(titleInput, "Test event");

    await waitFor(() => {
      expect(titleInput).toHaveValue("Test event");
    });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    user.type(startTimeField, "0100 AM");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("01:00 AM");
    });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    user.type(endDateField, "08012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("08/01/2021");
    });

    const endTimeField = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;

    user.type(endTimeField, "0200 AM");

    await waitFor(() => expect(endTimeField).toHaveValue("02:00 AM"));

    jest.useRealTimers();

    user.type(screen.getByLabelText(t("communities:location")), "tes{enter}");

    await waitFor(() => {
      expect(screen.getByLabelText(t("communities:location"))).toHaveValue(
        "tes",
      );
    });

    user.click(await screen.findByText("test city, test county, test country"));

    user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    await waitFor(() => {
      expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
        "sick social!",
      );
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));

    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(
      () => {
        expect(serviceFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );
  });
});
