import { Meta, Story } from "@storybook/react";
import * as React from "react";

import EditUserLocationMap, {
  EditUserLocationMapProps,
} from "./EditUserLocationMap";

export default {
  argTypes: {
    backgroundColor: { control: "color" },
  },
  component: EditUserLocationMap,
  title: "Components/Composite/EditUserLocationMap",
} as Meta;

const london = {
  address: "London",
  lat: 51.5,
  lng: -0.1,
  radius: 250,
} as EditUserLocationMapProps["location"];

const new_york = {
  address: "New York",
  lat: 40.71387,
  lng: -74.00566,
  radius: 1000,
} as EditUserLocationMapProps["location"];

const Template: Story<EditUserLocationMapProps> = (args) => (
  <div style={{ height: args.height, width: "50%" }}>
    <EditUserLocationMap {...args} />
    <p>Press enter to search, then customise the text.</p>
    <p>Changes logged to console.</p>
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  height: "60vh",
  grow: true,
  setLocation: console.log,
  location: london,
};

export const NewYork = Template.bind({});
NewYork.args = {
  height: "40vh",
  grow: false,
  setLocation: console.log,
  location: new_york,
};

export const HiddenRadiusSlider = Template.bind({});
HiddenRadiusSlider.args = {
  height: "40vh",
  grow: true,
  setLocation: console.log,
  location: new_york,
  hideRadiusSlider: true,
};
