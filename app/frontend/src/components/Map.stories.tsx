import { Meta, Story } from "@storybook/react";
import { LngLat } from "maplibre-gl";
import * as React from "react";

import Map, { MapProps } from "./Map";

export default {
  title: "Components/Large/Map",
  component: Map,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const defaultCenter = new LngLat(-0.1, 51.5);

const Template: Story<MapProps> = (args) => (
  <>
    <Map {...args} />
    <p>A default sized map. Moving logs new position to console.</p>
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
