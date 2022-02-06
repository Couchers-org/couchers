import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import * as React from "react";

import Navigation from ".";

export default {
  argTypes: {},
  component: Navigation,
  decorators: [
    (storyFn) => {
      return <AuthProvider>{storyFn()}</AuthProvider>;
    },
  ],
  title: "Components/Composite/Navigation",
} as Meta;

const Template: Story<any> = (args) => <Navigation {...args} />;

export const Primary = Template.bind({});
Primary.args = {};
