import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapUI from "components/Map";
import mapboxgl from "maplibre-gl";
import { useEffect } from "react";
import { server } from "test/restMock";
import { t } from "test/utils";

import EditLocationMap from "./EditLocationMap";

jest.mock("components/Map");
jest.mock("maplibre-gl");

const getCanvasMock = mapboxgl.Map.prototype.getCanvas as jest.Mock;
const MapMock = MapUI as jest.Mock;
const wrapMock = mapboxgl.LngLat.prototype.wrap as jest.Mock;
const getSourceMock = mapboxgl.Map.prototype.getSource as jest.Mock;

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
        postMapInitialize?.(new mapboxgl.Map());
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
        />
      );
      await waitFor(() =>
        expect(
          screen.getByText(
            t("global:components.edit_location_map.display_location_label")
          )
        ).toHaveAttribute("data-shrink", "false")
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
        />
      );
      await waitFor(() =>
        expect(
          screen.getByText(
            t("global:components.edit_location_map.display_location_label")
          )
        ).toHaveAttribute("data-shrink", "true")
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
        />
      );

      await userEvent.type(
        screen.getByLabelText(
          t("global:components.edit_location_map.search_location_label")
        ),
        "test{enter}"
      );
      await userEvent.click(
        await screen.findByRole("option", {
          name: "test city, test county, test country",
        })
      );

      expect(
        screen.getByText(
          t("global:components.edit_location_map.display_location_label")
        )
      ).toHaveAttribute("data-shrink", "true");
      expect(
        screen.getByLabelText(
          t("global:components.edit_location_map.display_location_label")
        )
      ).toHaveValue("test city, test country");
      await waitFor(() => {
        expect(
          screen
            .getByRole("combobox")
            .classList.contains("MuiAutocomplete-loading")
        ).toBe(false);
        expect(updateLocation).toHaveBeenCalledTimes(1);
      });
    });
  });
});
