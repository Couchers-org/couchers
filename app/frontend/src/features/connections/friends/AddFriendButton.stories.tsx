import { action } from "@storybook/addon-actions";
import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import { mockedService } from "../../../stories/__mocks__/service";
import AddFriendButton from "./AddFriendButton";

mockedService.api.sendFriendRequest = async () => {
  action("sendFriendRequest");
  return new Empty();
};

export default {
  title: "Me/Connections/AddFriendButton",
  component: AddFriendButton,
  argTypes: {
    setMutationError: {
      action: "setError",
    },
  },
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <AddFriendButton {...args} />
  </>
);

export const addFriendButton = Template.bind({});
addFriendButton.args = {
  userId: 1,
};
