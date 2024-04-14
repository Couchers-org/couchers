import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LngLat } from "maplibre-gl";
import { useForm } from "react-hook-form";
import { rest, server } from "test/restMock";
import { t } from "test/utils";
import { GeocodeResult } from "utils/hooks";

import LocationAutocomplete from "./LocationAutocomplete";

const submitAction = jest.fn();
const submitInvalidAction = jest.fn();

const LABEL = "My location autocomplete";

const renderForm = (
  defaultValue: GeocodeResult | "",
  onChange: (value: GeocodeResult | "") => void,
  showFullDisplayName = false,
  disableRegions = false
) => {
  const Form = () => {
    const { control, handleSubmit, errors } = useForm();
    const onSubmit = handleSubmit(submitAction, submitInvalidAction);

    return (
      <form onSubmit={onSubmit}>
        <LocationAutocomplete
          control={control}
          defaultValue={defaultValue}
          onChange={onChange}
          name="location"
          label={LABEL}
          showFullDisplayName={showFullDisplayName}
          fieldError={errors.location?.message}
          disableRegions={disableRegions}
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
    renderForm("", onChange);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
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
            isRegion: false,
            bbox: [1, 1, 1, 1],
          },
        }),
        expect.anything()
      );
    });
  });

  it("shows the search result's full display name if showFullDisplayName is true", async () => {
    const onChange = jest.fn();
    renderForm("", onChange, true);

    userEvent.type(await screen.findByLabelText(LABEL), "tes{enter}");

    expect(
      await screen.findByText("test city, test county, test country")
    ).toBeVisible();
  });

  it("shows the list of places using the button instead of enter", async () => {
    const onChange = jest.fn();
    renderForm("", onChange);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "tes");
    userEvent.click(
      screen.getByRole("button", {
        name: t("global:location_autocomplete.search_location_button"),
      })
    );

    const item = await screen.findByText("test city, test country");
    expect(item).toBeVisible();
  });

  it("shows an error when submitting without selecting an option", async () => {
    const onChange = jest.fn();
    renderForm("", onChange);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "test");
    const submitButton = await screen.findByRole("button", { name: "submit" });
    userEvent.click(submitButton);
    expect(
      await screen.findByText(
        t("global:location_autocomplete.search_location_hint")
      )
    ).toBeVisible();
  });

  it("shows a default value and submits correctly when cleared", async () => {
    const onChange = jest.fn();
    renderForm(
      {
        name: "test location",
        simplifiedName: "test location",
        location: new LngLat(1, 2),
        bbox: [1, 1, 1, 1],
      },
      onChange
    );

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    expect(input).toBeVisible();
    expect(input).toHaveValue("test location");

    userEvent.clear(input);
    const submitButton = await screen.findByRole("button", { name: "submit" });
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitAction).toBeCalledWith(
        expect.objectContaining({
          location: "",
        }),
        expect.anything()
      );
    });
  });

  it("shows an error when the geocode lookup fails", async () => {
    server.use(
      rest.get(
        `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
        async (_req, res, ctx) => {
          return res(ctx.status(500), ctx.text("generic error"));
        }
      )
    );

    renderForm("", () => {});

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "test{enter}");

    const error = await screen.findByText("generic error");
    expect(error).toBeVisible();
  });

  it("shows an error when a region is selected and disableRegions is true", async () => {
    server.use(
      rest.get(
        `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
        (req, res, ctx) => {
          return res(
            ctx.json([
              {
                address: { country: "test country" },
                lon: 1.0,
                lat: 2.0,
                display_name: "test county, test country",
                boundingbox: [1, 1, 1, 1],
              },
            ])
          );
        }
      )
    );
    renderForm("", () => {}, false, true);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    userEvent.type(input, "tes{enter}");

    const item = await screen.findByText("test country");
    userEvent.click(item);

    const submitButton = await screen.findByRole("button", { name: "submit" });
    userEvent.click(submitButton);

    expect(
      await screen.findByText(t("global:location_autocomplete.more_specific"))
    ).toBeVisible();
    expect(submitAction).not.toBeCalled();
  });
});
