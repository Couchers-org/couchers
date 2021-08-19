import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CREATE, TITLE } from "features/constants";
import { Error as GrpcError } from "grpc-web";
import { useMutation } from "react-query";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import {
  CREATE_EVENT,
  END_DATE,
  END_TIME,
  EVENT_DETAILS,
  EVENT_LINK,
  LINK_REQUIRED,
  LOCATION,
  LOCATION_REQUIRED,
  START_DATE,
  START_TIME,
  VIRTUAL_EVENT,
} from "./constants";
import EventForm, { CreateEventData } from "./EventForm";

jest.mock("components/MarkdownInput");

const serviceFn = jest.fn();
function TestComponent() {
  const { error, mutate, isLoading } = useMutation<
    unknown,
    GrpcError,
    CreateEventData
  >(serviceFn);

  return (
    <EventForm
      error={error}
      mutate={mutate}
      isMutationLoading={isLoading}
      title={CREATE_EVENT}
    />
  );
}

function renderForm() {
  render(<TestComponent />, { wrapper });
}

function assertFieldVisibleWithValue(field: HTMLElement, value: string) {
  expect(field).toBeVisible();
  expect(field).toHaveValue(value);
}

describe("Event form", () => {
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
});
