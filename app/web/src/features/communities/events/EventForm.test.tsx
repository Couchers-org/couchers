import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CREATE, TITLE } from "features/constants";
import { Error as GrpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { useMutation } from "react-query";
import events from "test/fixtures/events.json";
import wrapper from "test/hookWrapper";
import { server } from "test/restMock";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import {
  CREATE_EVENT,
  END_DATE,
  END_TIME,
  EVENT_DETAILS,
  EVENT_IMAGE_INPUT_ALT,
  EVENT_LINK,
  LINK_REQUIRED,
  LOCATION,
  LOCATION_REQUIRED,
  START_DATE,
  START_TIME,
  UPLOAD_HELPER_TEXT,
  VIRTUAL_EVENT,
} from "./constants";
import EventForm, { CreateEventVariables } from "./EventForm";

jest.mock("components/MarkdownInput");

const serviceFn = jest.fn();
function TestComponent({ event }: { event?: Event.AsObject }) {
  const { error, mutate, isLoading } = useMutation<
    Event.AsObject,
    GrpcError,
    CreateEventVariables
  >(serviceFn);

  return (
    <EventForm
      error={error}
      event={event}
      mutate={mutate}
      isMutationLoading={isLoading}
      title={CREATE_EVENT}
    >
      {() => <button type="submit">{CREATE}</button>}
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
      await screen.findByRole("heading", { name: CREATE_EVENT })
    ).toBeVisible();
    expect(screen.getByText(UPLOAD_HELPER_TEXT)).toBeVisible();
    assertFieldVisibleWithValue(
      screen.getByLabelText(START_DATE),
      "08/01/2021"
    );
    assertFieldVisibleWithValue(screen.getByLabelText(START_TIME), "01:00");
    assertFieldVisibleWithValue(screen.getByLabelText(END_DATE), "08/01/2021");
    assertFieldVisibleWithValue(screen.getByLabelText(END_TIME), "02:00");
    assertFieldVisibleWithValue(screen.getByLabelText(LOCATION), "");
    expect(screen.getByText(VIRTUAL_EVENT)).toBeVisible();
    expect(screen.getByLabelText(VIRTUAL_EVENT)).not.toBeChecked();
    expect(screen.getByLabelText(EVENT_DETAILS)).toBeVisible();
    expect(screen.getByRole("button", { name: CREATE })).toBeVisible();
    expect(
      screen.getByRole("img", { name: EVENT_IMAGE_INPUT_ALT })
    ).toHaveAttribute("src", "imagePlaceholder.svg");
  });

  it("renders the form correctly when passed an event", async () => {
    renderForm(events[0]);

    assertFieldVisibleWithValue(
      await screen.findByLabelText(TITLE),
      "Weekly Meetup"
    );
    assertFieldVisibleWithValue(
      screen.getByLabelText(START_DATE),
      "06/29/2021"
    );
    assertFieldVisibleWithValue(screen.getByLabelText(START_TIME), "02:37");
    assertFieldVisibleWithValue(screen.getByLabelText(END_DATE), "06/29/2021");
    assertFieldVisibleWithValue(screen.getByLabelText(END_TIME), "03:37");
    assertFieldVisibleWithValue(
      screen.getByLabelText(LOCATION),
      "Concertgebouw"
    );
    expect(screen.getByLabelText(VIRTUAL_EVENT)).not.toBeChecked();
    assertFieldVisibleWithValue(
      screen.getByLabelText(EVENT_DETAILS),
      "*Be there* or be square!"
    );
    expect(
      screen.getByRole("img", { name: EVENT_IMAGE_INPUT_ALT })
    ).toHaveAttribute("src", "https://loremflickr.com/500/120/amsterdam");
  });

  it("renders the image input for an event with no photo correctly", async () => {
    renderForm(events[2]);

    expect(
      await screen.findByRole("img", { name: EVENT_IMAGE_INPUT_ALT })
    ).toHaveAttribute("src", "imagePlaceholder.svg");
  });

  it("should hide the location field when the virtual event checkbox is ticked", async () => {
    renderForm();

    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));

    expect(screen.getByLabelText(VIRTUAL_EVENT)).toBeChecked();
    expect(screen.getByLabelText(EVENT_LINK)).toBeVisible();
    expect(screen.queryByLabelText(LOCATION)).not.toBeInTheDocument();
  });

  it("should not submit if the title is missing", async () => {
    renderForm();

    userEvent.click(screen.getByRole("button", { name: CREATE }));
    await waitFor(() => {
      expect(serviceFn).not.toHaveBeenCalled();
    });
  });

  it("should not submit if location is missing for an offline event", async () => {
    renderForm();
    userEvent.type(screen.getByLabelText(TITLE), "Test event");

    userEvent.click(screen.getByRole("button", { name: CREATE }));

    expect(await screen.findByText(LOCATION_REQUIRED)).toBeVisible();
    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should not submit if an event meeting link is missing for an online event", async () => {
    renderForm();
    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    expect(await screen.findByText(LINK_REQUIRED)).toBeVisible();
    expect(serviceFn).not.toHaveBeenCalled();
  });

  it("should submit the form successfully if all required fields are filled in", async () => {
    renderForm();

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));
    userEvent.type(
      screen.getByLabelText(EVENT_LINK),
      "https://couchers.org/social"
    );
    userEvent.type(screen.getByLabelText(EVENT_DETAILS), "sick social!");
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(() => {
      expect(serviceFn).toHaveBeenCalledTimes(1);
    });
  });

  it("should show an error alert if the form failed to submit", async () => {
    mockConsoleError();
    const errorMessage = "Error submitting event";
    serviceFn.mockRejectedValue(new Error(errorMessage));
    renderForm();

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    userEvent.click(screen.getByLabelText(VIRTUAL_EVENT));
    userEvent.type(
      screen.getByLabelText(EVENT_LINK),
      "https://couchers.org/social"
    );
    userEvent.type(screen.getByLabelText(EVENT_DETAILS), "sick social!");
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(() => {
      expect(serviceFn).toHaveBeenCalledTimes(1);
    });
    await assertErrorAlert(errorMessage);
  });

  it("should submit an offline event successfully", async () => {
    renderForm();

    userEvent.type(screen.getByLabelText(TITLE), "Test event");
    jest.useRealTimers();
    userEvent.type(screen.getByLabelText(LOCATION), "tes{enter}");
    userEvent.click(
      await screen.findByText("test city, test county, test country")
    );
    userEvent.type(screen.getByLabelText(EVENT_DETAILS), "sick social!");

    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    userEvent.click(screen.getByRole("button", { name: CREATE }));

    await waitFor(
      () => {
        expect(serviceFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );
  });
});
