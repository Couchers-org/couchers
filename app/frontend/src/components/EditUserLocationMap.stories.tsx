import { Box } from "@material-ui/core";
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

const user = {
  city: "London",
  lat: 51.5,
  lng: -0.1,
  radius: 250,
} as EditUserLocationMapProps["user"];

const Template: Story<EditUserLocationMapProps> = (args) => (
  <Box style={{ height: "60vh", width: "50%" }}>
    <EditUserLocationMap {...args} grow />
    <p>Press enter to search, then customise the text.</p>
    <p>Changes logged to console.</p>
  </Box>
);

export const Primary = Template.bind({});
Primary.args = {
  grow: true,
  setLocation: console.log,
  user,
};
