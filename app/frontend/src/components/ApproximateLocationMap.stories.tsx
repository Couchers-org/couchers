import { Meta, Story } from "@storybook/react";
import { LngLat } from "mapbox-gl";
import * as React from "react";

import ApproximateLocationMap, {
  ApproximateLocation,
  ApproximateLocationMapProps,
} from "./ApproximateLocationMap";
import Map from "./Map";

export default {
  title: "Components/ApproximateLocationMap",
  component: ApproximateLocationMap,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const initialLocation = {
  location: new LngLat(-0.1, 51.5),
  radius: 200,
} as ApproximateLocationMapProps["initialLocation"];

const setLocation = (location: ApproximateLocation) => {
  console.log(location);
};

const Template: Story<ApproximateLocationMapProps> = (args) => {
  return (
    <>
      <ApproximateLocationMap {...args} setLocation={setLocation} />
      <p>Location is logged to console when updated.</p>
    </>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  initialLocation,
  handleSize: 20,
};
