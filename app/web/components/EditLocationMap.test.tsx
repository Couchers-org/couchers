import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapUI from "components/OldMap";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { useEffect } from "react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { rest, server } from "test/restMock";

import EditLocationMap from "./EditLocationMap";

const { t } = i18n;

jest.mock("components/OldMap");
jest.mock("maplibre-gl");

const getCanvasMock = MaplibreMap.prototype.getCanvas as jest.Mock;
const MapMock = MapUI as jest.Mock;
const wrapMock = LngLat.prototype.wrap as jest.Mock;
const getSourceMock = MaplibreMap.prototype.getSource as jest.Mock;

describe("Edit location map", () => {
  beforeEach(() => {
    getCanvasMock.mockImplementation(() => ({
      style: {
        set cursor(value: string) {},
      },
    }));
    getSourceMock.mockImplementation(() => {
      return {
        setData: jest.fn(),
      };
    });

    wrapMock.mockReturnThis();

    MapMock.mockImplementation(({ postMapInitialize }) => {
      useEffect(() => {
        postMapInitialize?.(
          new MaplibreMap({
            container: document.createElement("div"),
            style: "mapbox://styles/mapbox/streets-v11",
          }),
        );
      });
      return <div>Map</div>;
    });
  });

  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe("The 'Display Location' label", () => {
    it("is not shrunk when the location is empty", async () => {
      render(
        <EditLocationMap
          initialLocation={{
            address: "",
            lat: 1,
            lng: 2,
            radius: 100,
          }}
          updateLocation={jest.fn()}
        />,
        { wrapper },
      );
      await waitFor(() =>
        expect(screen.getByText(t("global:components.edit_location_map.display_location_label"))).toHaveAttribute(
          "data-shrink",
          "false",
        ),
      );
    });

    it("is shrunk when there is a default location", async () => {
      render(
        <EditLocationMap
          initialLocation={{
            address: "test location",
            lat: 1,
            lng: 2,
            radius: 100,
          }}
          updateLocation={jest.fn()}
        />,
        { wrapper },
      );
      await waitFor(() =>
        expect(screen.getByText(t("global:components.edit_location_map.display_location_label"))).toHaveAttribute(
          "data-shrink",
          "true",
        ),
      );
    });

    it("is shrunk again when being populated from a search result", async () => {
      const updateLocation = jest.fn();
      render(
        <EditLocationMap
          initialLocation={{
            address: "",
            lat: 1,
            lng: 2,
            radius: 100,
          }}
          updateLocation={updateLocation}
        />,
        { wrapper },
      );

      const user = userEvent.setup();

      await user.type(
        screen.getByLabelText(t("global:components.edit_location_map.search_location_label")),
        "test{enter}",
      );
      await user.click(
        await screen.findByRole("option", {
          name: "test city, test county, test country",
        }),
      );

      expect(screen.getByText(t("global:components.edit_location_map.display_location_label"))).toHaveAttribute(
        "data-shrink",
        "true",
      );
      expect(screen.getByLabelText(t("global:components.edit_location_map.display_location_label"))).toHaveValue(
        "test city, test country",
      );
      await waitFor(() => {
        expect(screen.getByRole("combobox").classList.contains("MuiAutocomplete-loading")).toBe(false);
        expect(updateLocation).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('the "use my location" button (LOC-4)', () => {
    const BUTTON = t("global:use_my_location.button");
    const REVERSE_URL = `${process.env
      .NEXT_PUBLIC_GEOCODE_EARTH_BASE_URL!}/v1/reverse`;

    const mockPosition = (granted: boolean) => {
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
              : onError({
                  code: 1,
                  message: "denied",
                } as GeolocationPositionError),
        },
      });
    };

    const renderMap = (updateLocation = jest.fn()) => {
      render(
        <EditLocationMap
          initialLocation={{ address: "", lat: 0, lng: 0, radius: 100 }}
          updateLocation={updateLocation}
        />,
        { wrapper },
      );
      return updateLocation;
    };

    it("fills the display address from the device position", async () => {
      mockPosition(true);
      server.use(
        rest.get(REVERSE_URL, (_req, res, ctx) =>
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
      const updateLocation = renderMap();
      const user = userEvent.setup();

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      await waitFor(() => {
        expect(
          screen.getByLabelText(
            t("global:components.edit_location_map.display_location_label"),
          ),
        ).toHaveValue("Paris, Île-de-France, France");
      });
      expect(updateLocation).toHaveBeenCalled();
    });

    it("explains a denied permission and leaves the address editable", async () => {
      mockPosition(false);
      renderMap();
      const user = userEvent.setup();

      await user.click(await screen.findByRole("button", { name: BUTTON }));

      expect(
        await screen.findByText(t("global:use_my_location.permission_denied")),
      ).toBeVisible();

      const addressField = screen.getByLabelText(
        t("global:components.edit_location_map.display_location_label"),
      );
      await user.type(addressField, "Somewhere");
      expect(addressField).toHaveValue("Somewhere");
    });
  });
});
