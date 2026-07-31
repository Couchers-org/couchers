import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LngLat } from "maplibre-gl";
import { useForm } from "react-hook-form";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { rest, server } from "test/restMock";
import { resetFailoverState } from "utils/geocode";
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
  allowFallback = true,
  showUseMyLocation = false,
  preferCity = false,
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
          allowFallback={allowFallback}
          showUseMyLocation={showUseMyLocation}
          preferCity={preferCity}
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
    resetFailoverState();
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

    expect(
      await screen.findByText("second city, second country"),
    ).toBeVisible();
    expect(
      screen.queryByText("first city, first country"),
    ).not.toBeInTheDocument();
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
    // 400 is a bad request, not an outage, so no fallback is attempted.
    server.use(
      rest.get(AUTOCOMPLETE_URL, async (_req, res, ctx) => {
        return res(ctx.status(400), ctx.text("generic error"));
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

  describe('the "use my location" button (LOC-4)', () => {
    const BUTTON = t("global:use_my_location.button");
    const REVERSE_URL = `${process.env
      .NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/reverse`;

    const mockPosition = (granted: boolean, code = 1) => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (
            onSuccess: PositionCallback,
            onError: PositionErrorCallback,
          ) =>
            granted
              ? onSuccess({
                  coords: { latitude: 48.8566, longitude: 2.3522 },
                } as GeolocationPosition)
              : onError({ code, message: "nope" } as GeolocationPositionError),
        },
      });
    };

    const mockReverse = (status = 200) =>
      server.use(
        rest.get(REVERSE_URL, (_req, res, ctx) =>
          status === 200
            ? res(
                ctx.json({
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [2.3522, 48.8566],
                      },
                      bbox: [2.224, 48.815, 2.47, 48.902],
                      properties: {
                        gid: "whosonfirst:locality:101751119",
                        layer: "locality",
                        label: "Paris, Île-de-France, France",
                        name: "Paris",
                        locality: "Paris",
                        region: "Île-de-France",
                        country: "France",
                      },
                    },
                  ],
                }),
              )
            : res(ctx.status(status), ctx.text("down")),
        ),
      );

    it("is not shown unless the widget asks for it", async () => {
      renderForm("", () => {});
      await screen.findByLabelText(LABEL);
      expect(
        screen.queryByRole("button", { name: BUTTON }),
      ).not.toBeInTheDocument();
    });

    it("fills the field with the resolved place", async () => {
      mockPosition(true);
      mockReverse();
      const onChange = jest.fn();
      renderForm("", onChange, false, false, true, true);
      const user = userEvent.setup();
      const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      await waitFor(() => {
        expect(input).toHaveValue("Paris, Île-de-France, France");
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "whosonfirst:locality:101751119",
          simplifiedName: "Paris, Île-de-France, France",
        }),
      );
    });

    it("fills a city-level field with the city, not the street", async () => {
      // Destination search looks for hosts in a city, so the street the device is
      // standing on collapses to the city around it (and gets the city's bbox).
      const PLACE_URL = `${process.env
        .NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/place`;
      mockPosition(true);
      server.use(
        rest.get(REVERSE_URL, (_req, res, ctx) =>
          res(
            ctx.json({
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [2.3512, 48.8565] },
                  properties: {
                    gid: "openstreetmap:address:1",
                    layer: "address",
                    label: "8 Place De L'Hotel De Ville, Paris, France",
                    name: "8 Place De L'Hotel De Ville",
                    locality: "Paris",
                    locality_gid: "whosonfirst:locality:101751119",
                    region: "Île-de-France",
                    country: "France",
                  },
                },
              ],
            }),
          ),
        ),
        rest.get(PLACE_URL, (_req, res, ctx) =>
          res(
            ctx.json({
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
                  bbox: [2.224, 48.815, 2.47, 48.902],
                  properties: {
                    gid: "whosonfirst:locality:101751119",
                    layer: "locality",
                    label: "Paris, Île-de-France, France",
                    name: "Paris",
                    locality: "Paris",
                    region: "Île-de-France",
                    country: "France",
                  },
                },
              ],
            }),
          ),
        ),
      );
      const onChange = jest.fn();
      renderForm("", onChange, false, false, true, true, true);
      const user = userEvent.setup();
      const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      await waitFor(() => {
        expect(input).toHaveValue("Paris, Île-de-France, France");
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          simplifiedName: "Paris, Île-de-France, France",
          bbox: [2.47, 48.902, 2.224, 48.815],
        }),
      );
    });

    it("explains a denied permission and still allows typing", async () => {
      mockPosition(false, 1);
      renderForm("", () => {}, false, false, true, true);
      const user = userEvent.setup();
      const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      expect(
        await screen.findByText(t("global:use_my_location.permission_denied")),
      ).toBeVisible();

      // No dead end: the field still works, and the message clears as they type.
      await user.type(input, "tes");
      expect(input).toHaveValue("tes");
      expect(await screen.findByText("test city, test country")).toBeVisible();
      expect(
        screen.queryByText(t("global:use_my_location.permission_denied")),
      ).not.toBeInTheDocument();
    });

    it("explains an unavailable position and still allows typing", async () => {
      mockPosition(false, 2 /* POSITION_UNAVAILABLE */);
      renderForm("", () => {}, false, false, true, true);
      const user = userEvent.setup();
      const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      expect(
        await screen.findByText(
          t("global:use_my_location.position_unavailable"),
        ),
      ).toBeVisible();
      await user.type(input, "tes");
      expect(input).toHaveValue("tes");
    });

    it("explains a failed provider lookup and still allows typing", async () => {
      mockPosition(true);
      mockReverse(503);
      renderForm("", () => {}, false, false, true, true);
      const user = userEvent.setup();
      const input = (await screen.findByLabelText(LABEL)) as HTMLInputElement;

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      expect(
        await screen.findByText(t("global:use_my_location.lookup_failed")),
      ).toBeVisible();
      await user.type(input, "tes");
      expect(input).toHaveValue("tes");
    });

    it("reports when the provider has nothing at that point", async () => {
      mockPosition(true);
      server.use(
        rest.get(REVERSE_URL, (_req, res, ctx) =>
          res(ctx.json({ type: "FeatureCollection", features: [] })),
        ),
      );
      renderForm("", () => {}, false, false, true, true);
      const user = userEvent.setup();
      await screen.findByLabelText(LABEL);

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      expect(
        await screen.findByText(t("global:use_my_location.no_address")),
      ).toBeVisible();
    });
  });

  describe("during a Geocode.earth outage", () => {
    const SEARCH_BUTTON = t(
      "global:location_autocomplete.search_location_button",
    );
    const SEARCH_HINT = t("global:location_autocomplete.search_location_hint");
    const FALLBACK_RESULT = "fallback city, fallback state, fallback country";

    const failPelias = () =>
      server.use(
        rest.get(AUTOCOMPLETE_URL, async (_req, res, ctx) => {
          return res(ctx.status(503), ctx.text("unavailable"));
        }),
      );

    // Type enough to trigger the typeahead, which fails over to Nominatim and
    // flips the widget into submit mode.
    const triggerFallback = async (
      user: ReturnType<typeof userEvent.setup>,
      input: HTMLElement,
    ) => {
      await user.type(input, "test");
      expect(await screen.findByText(FALLBACK_RESULT)).toBeVisible();
    };

    it("serves fallback results and switches to the search button and hint", async () => {
      failPelias();
      renderForm("", () => {});
      const user = userEvent.setup();
      const input = await screen.findByLabelText(LABEL);

      expect(
        screen.queryByRole("button", { name: SEARCH_BUTTON }),
      ).not.toBeInTheDocument();

      await triggerFallback(user, input);

      expect(
        await screen.findByRole("button", { name: SEARCH_BUTTON }),
      ).toBeVisible();
      expect(await screen.findByText(SEARCH_HINT)).toBeVisible();
    });

    it("stops querying as the user types once in submit mode", async () => {
      failPelias();
      let fallbackRequests = 0;
      server.use(
        rest.get(
          `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
          (_req, res, ctx) => {
            fallbackRequests += 1;
            return res(
              ctx.json([
                {
                  place_id: 1,
                  display_name: FALLBACK_RESULT,
                  lat: "4.0",
                  lon: "3.0",
                  boundingbox: ["1", "2", "3", "4"],
                  importance: 0.5,
                  address: {
                    city: "fallback city",
                    state: "fallback state",
                    country: "fallback country",
                  },
                },
              ]),
            );
          },
        ),
      );
      renderForm("", () => {});
      const user = userEvent.setup();
      const input = await screen.findByLabelText(LABEL);

      await triggerFallback(user, input);
      expect(fallbackRequests).toBe(1);

      // Further typing must not reach Nominatim — it is submit-driven only.
      await user.type(input, " more text");
      await waitFor(() => {
        expect(fallbackRequests).toBe(1);
      });

      await user.click(screen.getByRole("button", { name: SEARCH_BUTTON }));
      await waitFor(() => {
        expect(fallbackRequests).toBe(2);
      });
    });

    it("searches on Enter as well as on the search button", async () => {
      failPelias();
      let fallbackRequests = 0;
      server.use(
        rest.get(
          `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
          (_req, res, ctx) => {
            fallbackRequests += 1;
            return res(
              ctx.json([
                {
                  place_id: 1,
                  display_name: FALLBACK_RESULT,
                  lat: "4.0",
                  lon: "3.0",
                  boundingbox: ["1", "2", "3", "4"],
                  importance: 0.5,
                  address: {
                    city: "fallback city",
                    state: "fallback state",
                    country: "fallback country",
                  },
                },
              ]),
            );
          },
        ),
      );
      renderForm("", () => {});
      const user = userEvent.setup();
      const input = await screen.findByLabelText(LABEL);

      await triggerFallback(user, input);
      expect(fallbackRequests).toBe(1);

      // Editing the text drops the stale hits, so Enter means "search again".
      await user.type(input, " again");
      expect(screen.queryByText(FALLBACK_RESULT)).not.toBeInTheDocument();

      await user.type(input, "{enter}");

      expect(await screen.findByText(FALLBACK_RESULT)).toBeVisible();
      expect(fallbackRequests).toBe(2);
    });

    it("does not submit the form when Enter triggers a fallback search", async () => {
      failPelias();
      renderForm("", () => {});
      const user = userEvent.setup();
      const input = await screen.findByLabelText(LABEL);

      await triggerFallback(user, input);
      await user.type(input, " again{enter}");

      await waitFor(() => {
        expect(screen.getByText(FALLBACK_RESULT)).toBeVisible();
      });
      expect(submitAction).not.toBeCalled();
    });

    it("starts a newly mounted widget in submit mode, without querying", async () => {
      failPelias();
      let fallbackRequests = 0;
      server.use(
        rest.get(
          `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
          (_req, res, ctx) => {
            fallbackRequests += 1;
            return res(ctx.json([]));
          },
        ),
      );
      const user = userEvent.setup();

      // First widget discovers the outage (this mock returns no places, so wait
      // on the request rather than on a rendered result).
      renderForm("", () => {});
      await user.type(await screen.findByLabelText(LABEL), "test");
      await waitFor(() => {
        expect(fallbackRequests).toBe(1);
      });

      // A later navigation mounts a fresh widget: it must already be in submit
      // mode, and must not query anything as the user types.
      cleanup();
      renderForm("", () => {});
      const input = await screen.findByLabelText(LABEL);

      expect(
        await screen.findByRole("button", { name: SEARCH_BUTTON }),
      ).toBeVisible();
      await user.type(input, "somewhere");
      await waitFor(() => {
        expect(fallbackRequests).toBe(1);
      });

      await user.click(screen.getByRole("button", { name: SEARCH_BUTTON }));
      await waitFor(() => {
        expect(fallbackRequests).toBe(2);
      });
    });

    it("fails closed with a retry message when allowFallback is false", async () => {
      failPelias();
      let fallbackRequests = 0;
      server.use(
        rest.get(
          `${process.env.NEXT_PUBLIC_NOMINATIM_URL!}search`,
          (_req, res, ctx) => {
            fallbackRequests += 1;
            return res(ctx.json([]));
          },
        ),
      );
      renderForm("", () => {}, false, false, false);
      const user = userEvent.setup();
      const input = await screen.findByLabelText(LABEL);

      await user.type(input, "test");

      expect(
        await screen.findByText(
          t("global:location_autocomplete.provider_unavailable"),
        ),
      ).toBeVisible();
      expect(fallbackRequests).toBe(0);
      // The widget stays a typeahead: no submit UI, since nothing degraded.
      expect(
        screen.queryByRole("button", { name: SEARCH_BUTTON }),
      ).not.toBeInTheDocument();
    });

    it("submits a fallback result that has no provider id", async () => {
      failPelias();
      renderForm("", () => {});
      const user = userEvent.setup();
      const input = await screen.findByLabelText(LABEL);

      await triggerFallback(user, input);
      await user.click(screen.getByText(FALLBACK_RESULT));
      await user.click(await screen.findByRole("button", { name: "submit" }));

      await waitFor(() => {
        expect(submitAction).toBeCalledWith(
          expect.objectContaining({
            location: expect.objectContaining({
              name: FALLBACK_RESULT,
              simplifiedName: FALLBACK_RESULT,
              location: new LngLat(3.0, 4.0),
              bbox: [4, 2, 3, 1],
              isRegion: false,
            }),
          }),
          expect.anything(),
        );
      });
      expect(submitAction.mock.calls[0][0].location.id).toBeUndefined();
    });
  });
});
