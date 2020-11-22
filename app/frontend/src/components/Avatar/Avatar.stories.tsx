// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";

import { Avatar, AvatarProps } from ".";
// @ts-ignore
import imageFile from "../../stories/assets/funnycat.jpg";

export default {
  title: "Components/Avatar",
  component: Avatar,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const user = {
  avatarUrl: imageFile,
} as AvatarProps["user"];

const Template: Story<AvatarProps> = (args) => (
  <>
    <div style={{ display: "flex" }}>
      <Avatar {...args} />A default sized Avatar with default sized text.
    </div>
    <div style={{ width: "400px", height: "400px" }}>
      <Avatar grow {...args} />
      An Avatar set to grow to the width of the containing block.
    </div>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
};
