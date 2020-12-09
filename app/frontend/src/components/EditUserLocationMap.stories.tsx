import { Meta, Story } from "@storybook/react";
import { LngLat } from "mapbox-gl";
import * as React from "react";
import { Marker } from "react-map-gl";
import EditUserLocationMap, {
  EditUserLocationMapProps,
} from "./EditUserLocationMap";

export default {
  title: "Components/EditUserLocationMap",
  component: EditUserLocationMap,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const user = {
  lat: 51.5,
  lng: -0.1,
  radius: 250,
  city: "London",
} as EditUserLocationMapProps["user"];

const Template: Story<EditUserLocationMapProps> = (args) => (
  <>
    <EditUserLocationMap {...args} />
    <p>Changes logged to console.</p>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
  setCity: console.log,
  setLocation: console.log,
};
