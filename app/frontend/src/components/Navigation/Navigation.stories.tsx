import { Meta, Story } from "@storybook/react";
import * as React from "react";
import { MemoryRouter as Router } from "react-router-dom";

import AuthProvider from "../../features/auth/AuthProvider";
import Navigation from ".";

export default {
  argTypes: {},
  component: Navigation,
  decorators: [
    (storyFn) => {
      return (
        <AuthProvider>
          <Router>{storyFn()}</Router>
        </AuthProvider>
      );
    },
  ],
  title: "Components/Composite/Navigation",
} as Meta;

const Template: Story<any> = (args) => <Navigation {...args} />;

export const Primary = Template.bind({});
Primary.args = {};
