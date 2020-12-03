import { Meta, Story } from "@storybook/react";
import * as React from "react";

import EditLocationMap, {
  EditLocationMapProps,
  UserLocation,
} from "./EditLocationMap";

export default {
  title: "Components/EditLocationMap",
  component: EditLocationMap,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const user = {
  lat: 51.5,
  lng: -0.1,
  radius: 200,
} as EditLocationMapProps["user"];

const setLocation = (location: UserLocation) => {
  console.log(location);
};

const Template: Story<EditLocationMapProps> = (args) => (
  <>
    <EditLocationMap {...args} setLocation={setLocation} />
    <p>Location is logged to console when updated.</p>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
};
