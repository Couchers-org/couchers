import { Meta, Story } from "@storybook/react";
import { LatLng } from "leaflet";
import * as React from "react";
import { Marker } from "react-leaflet";

import Map, { MapProps } from "./Map";

export default {
  title: "Components/Map",
  component: Map,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const defaultCenter = new LatLng(51.5, -0.1);

const Template: Story<MapProps> = (args) => (
  <>
    <Map {...args} />
    <p>A default sized Map.</p>
    <Map {...args}>
      <Marker position={defaultCenter} />
    </Map>
    <p>A Map with a marker.</p>
    <Map style={{ width: "400px", height: "50px" }} {...args} />
    <p>An explicitly sized Map.</p>
    <div style={{ width: "400px", border: "1px solid black" }}>
      <Map {...args} grow />
    </div>
    <p>A Map set to grow to the width of the containing block.</p>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  center: defaultCenter,
  zoom: 13,
};
