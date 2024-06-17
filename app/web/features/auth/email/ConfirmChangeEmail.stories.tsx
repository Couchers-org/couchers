import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { mockedService } from "stories/serviceMocks";

import ConfirmChangeEmail from "./ConfirmChangeEmail";

export default {
  component: ConfirmChangeEmail,
  title: "Me/Auth/ConfirmChangeEmailPage",
} as Meta;

interface ConfirmChangeEmailArgs {
  isLoading?: boolean;
  shouldConfirmChangeEmailSucceed?: boolean;
}

const Template: Story<ConfirmChangeEmailArgs> = ({
  isLoading = false,
  shouldConfirmChangeEmailSucceed = true,
} = {}) => {
  setMocks({ isLoading, shouldConfirmChangeEmailSucceed });
  return <ConfirmChangeEmail />;
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const Success = Template.bind({});
Success.args = {
  shouldConfirmChangeEmailSucceed: true,
};

export const Failed = Template.bind({});
Failed.args = {
  shouldConfirmChangeEmailSucceed: false,
};

function setMocks({
  isLoading,
  shouldConfirmChangeEmailSucceed,
}: Required<ConfirmChangeEmailArgs>) {
  mockedService.account.confirmChangeEmail = () =>
    isLoading
      ? new Promise(() => void 0)
      : shouldConfirmChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Invalid token"));
}
