import { Meta, Story } from "@storybook/react";
import * as React from "react";
import { MemoryRouter as Router } from "react-router-dom";

import AuthProvider from "../../features/auth/AuthProvider";
import Navigation from ".";

export default {
  title: "Components/Composite/Navigation",
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
