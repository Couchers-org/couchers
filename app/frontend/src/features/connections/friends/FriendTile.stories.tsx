import { Meta, Story } from "@storybook/react";

import FriendTile from "./FriendTile";

export default {
  title: "Me/Connections/FriendTile",
  component: FriendTile,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <FriendTile {...args}>Content</FriendTile>
  </>
);

export const friendTile = Template.bind({});
friendTile.args = {
  errorMessage: "",
  hasData: true,
  isLoading: false,
  noDataMessage: "No data",
  title: "Friend Tile",
};
