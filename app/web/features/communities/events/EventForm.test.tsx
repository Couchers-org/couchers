import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { useMutation } from "react-query";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { server } from "test/restMock";
import { assertErrorAlert, mockConsoleError, t } from "test/utils";

import EventForm, { CreateEventVariables } from "./EventForm";

jest.mock("components/MarkdownInput");

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
    jest.useFakeTimers("modern");
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
      })
    ).toBeVisible();
    expect(screen.getByText(t("communities:upload_helper_text"))).toBeVisible();
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_date")),
      "08/01/2021"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_time")),
      "01:00"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_date")),
      "08/01/2021"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_time")),
      "02:00"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:location")),
      ""
    );
    expect(screen.getByText(t("communities:virtual_event"))).toBeVisible();
    expect(
      screen.getByLabelText(t("communities:virtual_event"))
    ).not.toBeChecked();
    expect(screen.getByLabelText(t("communities:event_details"))).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("global:create") })
    ).toBeVisible();
    expect(
      screen.getByRole("img", { name: t("communities:event_image_input_alt") })
    ).toHaveAttribute("src", "/img/imagePlaceholder.svg");
  });

  it("renders the form correctly when passed an event", async () => {
    renderForm(events[0]);

    assertFieldVisibleWithValue(
      await screen.findByLabelText(t("global:title")),
      "Weekly Meetup"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_date")),
      "06/29/2021"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:start_time")),
      "02:37"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_date")),
      "06/29/2021"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:end_time")),
      "03:37"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:location")),
      "Concertgebouw"
    );
    expect(
      screen.getByLabelText(t("communities:virtual_event"))
    ).not.toBeChecked();
    assertFieldVisibleWithValue(
      screen.getByLabelText(t("communities:event_details")),
      "*Be there* or be square!"
    );
    expect(
      screen.getByRole("img", { name: t("communities:event_image_input_alt") })
    ).toHaveAttribute("src", "https://loremflickr.com/500/120/amsterdam");
  });

  it("renders the image input for an event with no photo correctly", async () => {
    renderForm(events[2]);

    expect(
      await screen.findByRole("img", {
        name: t("communities:event_image_input_alt"),
      })
    ).toHaveAttribute("src", "/img/imagePlaceholder.svg");
  });

  it("should hide the location field when the virtual event checkbox is ticked", async () => {
    renderForm();

    await userEvent.click(
      screen.getByLabelText(t("communities:virtual_event"))
    );

    expect(screen.getByLabelText(t("communities:virtual_event"))).toBeChecked();
    expect(screen.getByLabelText(t("communities:event_link"))).toBeVisible();
    expect(
      screen.queryByLabelText(t("communities:location"))
    ).not.toBeInTheDocument();
  });

  it("should not submit if the title is missing", async () => {
    renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );
    await waitFor(() => {
      expect(serviceFn).not.toHaveBeenCalled();
    });
  });

  it("should not submit if location is missing for an offline event", async () => {
    renderForm();
    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );

    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    expect(
      await screen.findByText(t("communities:location_required"))
    ).toBeVisible();
    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should not submit if an event meeting link is missing for an online event", async () => {
    renderForm();
    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    await userEvent.click(
      screen.getByLabelText(t("communities:virtual_event"))
    );
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    expect(
      await screen.findByText(t("communities:link_required"))
    ).toBeVisible();
    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should submit the form successfully if all required fields are filled in", async () => {
    renderForm();

    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    await userEvent.click(
      screen.getByLabelText(t("communities:virtual_event"))
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_link")),
      "https://couchers.org/social"
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!"
    );
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    await waitFor(() => {
      expect(serviceFn).toHaveBeenCalledTimes(1);
    });
  });

  it("should show an error alert if the form failed to submit", async () => {
    mockConsoleError();
    const errorMessage = "Error submitting event";
    serviceFn.mockRejectedValue(new Error(errorMessage));
    renderForm();

    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    await userEvent.click(
      screen.getByLabelText(t("communities:virtual_event"))
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_link")),
      "https://couchers.org/social"
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!"
    );
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    await waitFor(() => {
      expect(serviceFn).toHaveBeenCalledTimes(1);
    });
    await assertErrorAlert(errorMessage);
  });

  it("should submit an offline event successfully", async () => {
    renderForm();

    await userEvent.type(
      screen.getByLabelText(t("global:title")),
      "Test event"
    );
    jest.useRealTimers();
    await userEvent.type(
      screen.getByLabelText(t("communities:location")),
      "tes{enter}"
    );
    await userEvent.click(
      await screen.findByText("test city, test county, test country")
    );
    await userEvent.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!"
    );

    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    await userEvent.click(
      screen.getByRole("button", { name: t("global:create") })
    );

    await waitFor(
      () => {
        expect(serviceFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );
  });
});
