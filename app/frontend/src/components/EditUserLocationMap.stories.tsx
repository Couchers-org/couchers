import { Box } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import * as React from "react";

import EditUserLocationMap, {
  EditUserLocationMapProps,
} from "./EditUserLocationMap";

export default {
  title: "Components/Large/EditUserLocationMap",
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
  <Box style={{ width: "50%", height: "60vh" }}>
    <EditUserLocationMap {...args} grow />
    <p>Press enter to search, then customise the text.</p>
    <p>Changes logged to console.</p>
  </Box>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
  setLocation: console.log,
  grow: true,
};
