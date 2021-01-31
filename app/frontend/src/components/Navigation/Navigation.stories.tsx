import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { MemoryRouter as Router } from "react-router-dom";

import AuthProvider from "../../features/auth/AuthProvider";
import Navigation from ".";

export default {
  title: "Components/Navigation",
  component: Navigation,
  argTypes: {},
  decorators: [
    (storyFn) => {
      return (
        <AuthProvider>
          <Router>{storyFn()}</Router>
        </AuthProvider>
      );
    },
  ],
} as Meta;

const Template: Story<any> = (args) => <Navigation {...args} />;

export const Primary = Template.bind({});
Primary.args = {};
