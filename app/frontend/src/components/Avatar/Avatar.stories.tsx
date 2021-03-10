import { Meta, Story } from "@storybook/react";
import * as React from "react";

import Avatar, { AvatarProps } from ".";

export default {
  argTypes: {
    backgroundColor: { control: "color" },
  },
  component: Avatar,
  title: "Components/Simple/Avatar",
} as Meta;

const user = {
  avatarUrl: "https://loremflickr.com/200/200",
  name: "Test User",
} as AvatarProps["user"];

const userNoImage = {
  avatarUrl: "",
  name: "Test User",
} as AvatarProps["user"];

const Template: Story<AvatarProps> = (args) => (
  <>
    <div style={{ display: "flex" }}>
      <Avatar {...args} />A default sized Avatar.
    </div>
    <div style={{ display: "flex" }}>
      <Avatar style={{ height: "50px", width: "100px" }} {...args} />
      An explicitly sized Avatar.
    </div>
    <div style={{ border: "1px solid black", width: "400px" }}>
      <Avatar grow {...args} />
      An Avatar set to grow to the width of the containing block.
    </div>
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
};

export const NoImage = Template.bind({});
NoImage.args = {
  user: userNoImage,
};

export const LoadingUser = Template.bind({});
LoadingUser.args = {
  user: undefined,
};
