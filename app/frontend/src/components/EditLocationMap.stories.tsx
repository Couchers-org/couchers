import { Meta, Story } from "@storybook/react";
import * as React from "react";

import EditLocationMap, { EditLocationMapProps } from "./EditLocationMap";

export default {
  argTypes: {
    backgroundColor: { control: "color" },
  },
  component: EditLocationMap,
  title: "Components/Composite/EditLocationMap",
} as Meta;

const london = {
  address: "London",
  lat: 51.5,
  lng: -0.1,
  radius: 250,
} as EditLocationMapProps["initialLocation"];

const new_york = {
  address: "New York",
  lat: 40.71387,
  lng: -74.00566,
  radius: 1000,
} as EditLocationMapProps["initialLocation"];

const Template: Story<EditLocationMapProps> = (args) => (
  <div style={{ height: "60vh", width: "50%" }}>
    <EditLocationMap {...args} grow />
    <p>Press enter to search, then customise the text.</p>
    <p>Changes logged to console.</p>
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  updateLocation: console.log,
  initialLocation: london,
  showRadiusSlider: true,
};

export const NewYork = Template.bind({});
NewYork.args = {
  updateLocation: console.log,
  initialLocation: new_york,
  showRadiusSlider: true,
};

export const HiddenRadiusSlider = Template.bind({});
HiddenRadiusSlider.args = {
  updateLocation: console.log,
  initialLocation: new_york,
};

export const NoLocation = Template.bind({});
NoLocation.args = {
  updateLocation: console.log,
};

export const Exact = Template.bind({});
Exact.args = {
  updateLocation: console.log,
  exact: true,
};

export const ExactNewYork = Template.bind({});
ExactNewYork.args = {
  updateLocation: console.log,
  initialLocation: new_york,
  exact: true,
};
