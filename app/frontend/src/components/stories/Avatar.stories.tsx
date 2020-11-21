// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
// @ts-ignore
import imageFile from "../../stories/assets/funnycat.jpg";

import Avatar, { AvatarProps } from "../Avatar";

export default {
  title: "Components/Avatar",
  component: Avatar,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const user = {
  avatarUrl: imageFile,
};

const Template: Story<AvatarProps> = (args) => (
  <>
    <div style={{ display: "flex" }}>
      <Avatar {...args} />A default sized Avatar with default sized text.
    </div>
    <div style={{ display: "flex", fontSize: "40px" }}>
      <Avatar {...args} />A default sized Avatar with big text makes the Avatar
      also big.
    </div>
    <div style={{ display: "flex" }}>
      <Avatar style={{ width: "100px", height: "100px" }} {...args} />
      An explicitly sized Avatar with default sized text.
    </div>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
};
