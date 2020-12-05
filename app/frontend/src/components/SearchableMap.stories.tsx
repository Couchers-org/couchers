import { Meta, Story } from "@storybook/react";
import { LatLng } from "leaflet";
import * as React from "react";
import { Marker } from "react-leaflet";
import SearchableMap, { SearchableMapProps } from "./SearchableMap";

export default {
  title: "Components/SearchableMap",
  component: SearchableMap,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const defaultCenter = new LatLng(51.5, -0.1);

const Template: Story<SearchableMapProps> = (args) => (
  <>
    <SearchableMap {...args}>
      <Marker position={defaultCenter} />
    </SearchableMap>
    <p>A default sized Map with a marker and search.</p>
    <div style={{ width: "400px", border: "1px solid black" }}>
      <SearchableMap {...args} grow />
    </div>
    <p>A Map with search set to grow to the width of the containing block.</p>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  center: defaultCenter,
  zoom: 13,
};
