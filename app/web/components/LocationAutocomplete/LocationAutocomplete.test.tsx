import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LngLat } from "maplibre-gl";
import { useForm } from "react-hook-form";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { rest, server } from "test/restMock";
import { GeocodeResult } from "utils/hooks";

import LocationAutocomplete from "./LocationAutocomplete";

const { t } = i18n;

const AUTOCOMPLETE_URL = `${process.env
  .NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/autocomplete`;

const submitAction = jest.fn();
const submitInvalidAction = jest.fn();

const LABEL = "My location autocomplete";

const renderForm = (
  defaultValue: GeocodeResult | "",
  onChange: (value: GeocodeResult | "") => void,
  showFullDisplayName = false,
  disableRegions = false,
) => {
  const Form = () => {
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<GeocodeResult>();
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
          autocompleteContext="test"
        />
        <input type="submit" aria-label="submit" />
      </form>
    );
  };
  render(<Form />, { wrapper });
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

    const user = userEvent.setup();

    await user.type(input, "tes{enter}");

    const item = await screen.findByText("test city, test country");
    expect(item).toBeVisible();
    await user.click(item);
    expect(input).toHaveValue("test city, test country");

    const submitButton = await screen.findByRole("button", { name: "submit" });
    await user.click(submitButton);
    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          location: {
            id: "whosonfirst:locality:1",
            name: "test city, test county, test country",
            simplifiedName: "test city, test country",
            location: { lng: 1.0, lat: 2.0 },
            isRegion: false,
            bbox: [1, 1, 1, 1],
          },
        }),
        expect.anything(),
      );
    });
  });

  it("shows live typeahead results without pressing enter, and debounces requests", async () => {
    let callCount = 0;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) => {
        callCount++;
        return res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [1.0, 2.0] },
                bbox: [1, 1, 1, 1],
                properties: {
                  gid: "whosonfirst:locality:1",
                  layer: "locality",
                  label: "test city, test county, test country",
                  name: "test city",
                  locality: "test city",
                  country: "test country",
                },
              },
            ],
          }),
        );
      }),
    );

    renderForm("", jest.fn());

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    const user = userEvent.setup();

    // Type several characters without pressing Enter or clicking search.
    await user.type(input, "test");

    const item = await screen.findByText("test city, test country");
    expect(item).toBeVisible();

    // Debounced: the four keystrokes collapse into a single provider request.
    expect(callCount).toBe(1);
  });

  it("selects a typeahead result without needing a submit click", async () => {
    const onChange = jest.fn();
    renderForm("", onChange);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    const user = userEvent.setup();

    await user.type(input, "test");

    const item = await screen.findByText("test city, test country");
    await user.click(item);

    expect(onChange).toBeCalledWith(
      expect.objectContaining({ simplifiedName: "test city, test country" }),
    );
  });

  it("does not keep previous results when searching again", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (req, res, ctx) => {
        const text = req.url.searchParams.get("text") ?? "";
        if (text.startsWith("first")) {
          return res(
            ctx.json({
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [1.0, 2.0] },
                  bbox: [1, 1, 1, 1],
                  properties: {
                    gid: "whosonfirst:locality:1",
                    layer: "locality",
                    label: "first city, first country",
                    name: "first city",
                    locality: "first city",
                    country: "first country",
                  },
                },
              ],
            }),
          );
        }
        return res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [3.0, 4.0] },
                bbox: [3, 3, 3, 3],
                properties: {
                  gid: "whosonfirst:locality:2",
                  layer: "locality",
                  label: "second city, second country",
                  name: "second city",
                  locality: "second city",
                  country: "second country",
                },
              },
            ],
          }),
        );
      }),
    );

    renderForm("", jest.fn());
    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    const user = userEvent.setup();

    await user.type(input, "first");
    expect(await screen.findByText("first city, first country")).toBeVisible();

    await user.clear(input);
    await user.type(input, "second");

    expect(await screen.findByText("second city, second country")).toBeVisible();
    expect(screen.queryByText("first city, first country")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no results", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) => {
        return res(ctx.json({ type: "FeatureCollection", features: [] }));
      }),
    );

    renderForm("", jest.fn());

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    const user = userEvent.setup();

    await user.type(input, "nowhere");

    expect(
      await screen.findByText(t("global:location_autocomplete.no_results")),
    ).toBeVisible();
  });

  it("shows the search result's full display name if showFullDisplayName is true", async () => {
    const onChange = jest.fn();
    renderForm("", onChange, true);

    const user = userEvent.setup();

    await user.type(await screen.findByLabelText(LABEL), "tes{enter}");

    expect(await screen.findByText("test city, test county, test country")).toBeVisible();
  });

  it("does not render a search button or enter-to-search hint", async () => {
    renderForm("", jest.fn());

    await screen.findByLabelText(LABEL);

    expect(
      screen.queryByRole("button", {
        name: t("global:location_autocomplete.search_location_button"),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Press Enter or click the search icon to choose a location",
      ),
    ).not.toBeInTheDocument();
  });

  it("hides the clear button when the input is empty and shows it when there is text", async () => {
    renderForm("", jest.fn());

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    const user = userEvent.setup();

    // disableClearable unmounts the control when empty (not merely hiding it).
    expect(
      screen.queryByRole("button", { name: "Clear" }),
    ).not.toBeInTheDocument();

    await user.type(input, "te");

    expect(await screen.findByRole("button", { name: "Clear" })).toBeVisible();

    await user.clear(input);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });
  });

  it("does not submit the form when Enter is pressed without selecting an option", async () => {
    const onChange = jest.fn();
    renderForm("", onChange);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    const user = userEvent.setup();

    await user.type(input, "test{enter}");

    // Typeahead still opens results (Enter flushes the debounce), but free text
    // is not a selected place — form submit must not succeed.
    expect(await screen.findByText("test city, test country")).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
    expect(submitAction).not.toHaveBeenCalled();
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
      onChange,
    );

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    expect(input).toBeVisible();
    expect(input).toHaveValue("test location");

    const user = userEvent.setup();

    await user.clear(input);
    const submitButton = await screen.findByRole("button", { name: "submit" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "",
        }),
        expect.anything(),
      );
    });
  });

  it("shows an error when the geocode lookup fails", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, async (_req, res, ctx) => {
        return res(ctx.status(500), ctx.text("generic error"));
      }),
    );

    renderForm("", () => {});

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;
    expect(input).toBeVisible();

    const user = userEvent.setup();

    await user.type(input, "test{enter}");

    const error = await screen.findByText("generic error");
    expect(error).toBeVisible();
  });

  it("renders suggestions localized to the current i18n.language", async () => {
    const originalLanguage = i18n.language;
    let requestedLang: string | null = null;
    server.use(
      rest.get(AUTOCOMPLETE_URL, (req, res, ctx) => {
        requestedLang = req.url.searchParams.get("lang");
        return res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [7.4474, 46.9481] },
                bbox: [7.0, 46.0, 8.0, 47.0],
                properties: {
                  gid: "whosonfirst:country:2",
                  layer: "country",
                  label: "Allemagne",
                  name: "Allemagne",
                  country: "Allemagne",
                },
              },
            ],
          }),
        );
      }),
    );

    await i18n.changeLanguage("fr-FR");
    renderForm("", jest.fn());

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(LABEL), "test");

    expect(await screen.findByText("Allemagne")).toBeVisible();
    expect(requestedLang).toBe("fr");

    await i18n.changeLanguage(originalLanguage);
  });

  it("shows an error when a region is selected and disableRegions is true", async () => {
    server.use(
      rest.get(AUTOCOMPLETE_URL, (_req, res, ctx) => {
        return res(
          ctx.json({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [1.0, 2.0] },
                bbox: [1, 1, 1, 1],
                properties: {
                  gid: "whosonfirst:country:1",
                  layer: "country",
                  label: "test country",
                  name: "test country",
                  country: "test country",
                },
              },
            ],
          }),
        );
      }),
    );
    renderForm("", () => {}, false, true);

    const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;

    const user = userEvent.setup();

    await user.type(input, "tes{enter}");

    const item = await screen.findByText("test country");
    await user.click(item);

    const submitButton = await screen.findByRole("button", { name: "submit" });
    await user.click(submitButton);

    expect(await screen.findByText(t("global:location_autocomplete.more_specific"))).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });
});
