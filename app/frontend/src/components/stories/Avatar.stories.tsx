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
    <Avatar {...args} />
    <div style={{ fontSize: "100px" }}>
      <Avatar {...args} />
    </div>
    <Avatar style={{ width: "100px", height: "100px" }} {...args} />
  </>
);

export const Primary = Template.bind({});
Primary.args = {
  user,
};
