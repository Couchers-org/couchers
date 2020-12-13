import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "../../stories/__mocks__/store";
import FriendList from "./FriendList";

export default {
  title: "FriendList",
  component: FriendList,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </Provider>
    ),
  ],
} as Meta;

const Template: Story<{ customLoading?: boolean }> = () => (
  <div style={{ width: "50%" }}>
    <FriendList />
  </div>
);

export const WithFriends = Template.bind({});
WithFriends.args = {};
