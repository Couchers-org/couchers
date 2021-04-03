import { Meta, Story } from "@storybook/react";
import { LngLat } from "maplibre-gl";
import * as React from "react";

import Map, { MapProps } from "./Map";

export default {
  argTypes: {
    backgroundColor: { control: "color" },
  },
  component: Map,
  title: "Components/Composite/Map",
} as Meta;

const defaultCenter = new LngLat(-0.1, 51.5);

const Template: Story<MapProps> = (args) => (
  <>
    <Map {...args} />
    <p>A default sized map. Moving logs new position to console.</p>
    <div
      style={{ border: "1px solid black", height: "200px", maxWidth: "500px" }}
    >
      <Map {...args} grow />
    </div>
    <p>A Map set to grow to the width of the containing block.</p>
    <Map {...args} interactive={false} />
    <p>A default non-interactive map.</p>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  initialCenter: defaultCenter,
  initialZoom: 13,
  onUpdate: console.log,
};
