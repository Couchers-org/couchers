import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapUI from "components/Map";
import mapboxgl from "maplibre-gl";
import { useEffect } from "react";
import { server } from "test/restMock";

import { DISPLAY_LOCATION, SEARCH_FOR_LOCATION } from "./constants";
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
      expect(screen.getByText(DISPLAY_LOCATION)).toHaveAttribute(
        "data-shrink",
        "false"
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
      expect(screen.getByText(DISPLAY_LOCATION)).toHaveAttribute(
        "data-shrink",
        "true"
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

      userEvent.type(screen.getByLabelText(SEARCH_FOR_LOCATION), "test{enter}");
      userEvent.click(
        await screen.findByRole("option", {
          name: "test city, test county, test country",
        })
      );

      expect(screen.getByText(DISPLAY_LOCATION)).toHaveAttribute(
        "data-shrink",
        "true"
      );
      expect(screen.getByLabelText(DISPLAY_LOCATION)).toHaveValue(
        "test city, test country"
      );
      expect(updateLocation).toHaveBeenCalledTimes(1);
    });
  });
});
