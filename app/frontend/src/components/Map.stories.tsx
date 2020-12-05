import { Meta, Story } from "@storybook/react";
import { LngLat } from "mapbox-gl";
import * as React from "react";
import { Marker } from "react-map-gl";

import Map, { MapProps } from "./Map";
import MapSearch from "./MapSearch";

export default {
  title: "Components/Map",
  component: Map,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const defaultCenter = new LngLat(-0.1, 51.5);

const Template: Story<MapProps> = (args) => (
  <>
    <Map {...args}>
      <Marker latitude={defaultCenter.lat} longitude={defaultCenter.lng} />
    </Map>
    <p>
      A default sized Map with a marker. Moving logs new position to console.
    </p>
    <Map {...args}>
      <MapSearch />
    </Map>
    <p>A Map with search box.</p>
    <div
      style={{ maxWidth: "500px", height: "200px", border: "1px solid black" }}
    >
      <Map {...args} grow />
    </div>
    <p>A Map set to grow to the width of the containing block.</p>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  initialCenter: defaultCenter,
  initialZoom: 13,
  onUpdate: console.log,
};
