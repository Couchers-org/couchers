import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { Provider } from "react-redux";
import { MemoryRouter as Router } from "react-router-dom";
import { store } from "../../store";

import Navigation from ".";

export default {
  title: "Components/Navigation",
  component: Navigation,
  argTypes: {},
  decorators: [
    (storyFn) => {
      return (
        <Provider store={store}>
          <Router>{storyFn()}</Router>
        </Provider>
      );
    },
  ],
} as Meta;

const Template: Story<any> = (args) => <Navigation {...args} />;

export const Primary = Template.bind({});
Primary.args = {};
