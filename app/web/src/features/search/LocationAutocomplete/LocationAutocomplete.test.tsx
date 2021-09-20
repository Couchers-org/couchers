import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LngLat } from "maplibre-gl";
import { useForm } from "react-hook-form";
import { rest, server } from "test/restMock";
import { GeocodeResult } from "utils/hooks";

import {
  LOCATION,
  SEARCH_LOCATION_BUTTON,
  SELECT_LOCATION,
} from "../constants";
import LocationAutocomplete from "./index";

const submitAction = jest.fn();
const submitInvalidAction = jest.fn();

const renderForm = (
  defaultValue: GeocodeResult | undefined,
  onChange: (value: GeocodeResult | "") => void,
  showFullDisplayName = false
) => {
  const Form = () => {
    const { control, handleSubmit } = useForm();
    const onSubmit = handleSubmit(submitAction, submitInvalidAction);

    return (
      <form onSubmit={onSubmit}>
        <LocationAutocomplete
          control={control}
          defaultValue={defaultValue}
          onChange={onChange}
          label={LOCATION}
          showFullDisplayName={showFullDisplayName}
        />
        <input type="submit" aria-label="submit" />
      </form>
    );
  };
  render(<Form />);
};

describe("LocationAutocomplete component", () => {
  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  it("successfully searches and submits", async () => {
    const onChange = jest.fn();
    renderForm(undefined, onChange);

    const input = (await screen.findByLabelText(LOCATION)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "tes{enter}");

    const item = await screen.findByText("test city, test country");
    expect(item).toBeVisible();
    userEvent.click(item);
    expect(input.value).toBe("test city, test country");

    const submitButton = await screen.findByRole("button", { name: "submit" });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(submitAction).toBeCalledWith(
        expect.objectContaining({
          location: {
            name: "test city, test county, test country",
            simplifiedName: "test city, test country",
            location: { lng: 1.0, lat: 2.0 },
          },
        }),
        expect.anything()
      );
    });
  });

  it("shows the search result's full display name if showFullDisplayName is true", async () => {
    const onChange = jest.fn();
    renderForm(undefined, onChange, true);

    userEvent.type(await screen.findByLabelText(LOCATION), "tes{enter}");

    expect(
      await screen.findByText("test city, test county, test country")
    ).toBeVisible();
  });

  it("shows the list of places using the button instead of enter", async () => {
    const onChange = jest.fn();
    renderForm(undefined, onChange);

    const input = (await screen.findByLabelText(LOCATION)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "tes");
    userEvent.click(
      screen.getByRole("button", { name: SEARCH_LOCATION_BUTTON })
    );

    const item = await screen.findByText("test city, test country");
    expect(item).toBeVisible();
  });

  it("shows an error when submitting without selection an option", async () => {
    const onChange = jest.fn();
    renderForm(undefined, onChange);

    const input = (await screen.findByLabelText(LOCATION)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "test");
    const submitButton = await screen.findByRole("button", { name: "submit" });
    userEvent.click(submitButton);
    expect(await screen.findByText(SELECT_LOCATION)).toBeVisible();
  });

  it("shows a default value and submits correctly when cleared", async () => {
    const onChange = jest.fn();
    renderForm(
      {
        name: "test location",
        simplifiedName: "test location",
        location: new LngLat(1, 2),
      },
      onChange
    );

    const input = (await screen.findByLabelText(LOCATION)) as HTMLInputElement;
    expect(input).toBeVisible();
    expect(input).toHaveValue("test location");

    userEvent.clear(input);
    const submitButton = await screen.findByRole("button", { name: "submit" });
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitAction).toBeCalledWith(
        expect.objectContaining({
          location: null,
        }),
        expect.anything()
      );
    });
  });

  it("shows an error when the geocode lookup fails", async () => {
    server.use(
      rest.get(
        `${process.env.REACT_APP_NOMINATIM_URL!}search`,
        async (_req, res, ctx) => {
          return res(ctx.status(500), ctx.text("generic error"));
        }
      )
    );

    renderForm(undefined, () => {});

    const input = (await screen.findByLabelText(LOCATION)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "test{enter}");

    const error = await screen.findByText("generic error");
    expect(error).toBeVisible();
  });
});
