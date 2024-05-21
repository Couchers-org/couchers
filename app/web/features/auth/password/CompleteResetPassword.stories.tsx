import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import React from "react";

import SetNewPassword from "./CompleteResetPassword";

export default {
  component: SetNewPassword,
  title: "Me/Auth/SetNewPasswordPage",
} as Meta;

interface SetNewPasswordArgs {
  shouldSucceed?: boolean;
}

const Template: Story<SetNewPasswordArgs> = ({ shouldSucceed = true } = {}) => {
  setMocks({ shouldSucceed });
  return <SetNewPassword />;
};

export const Success = Template.bind({});

export const Failed = Template.bind({});
Failed.args = {
  shouldSucceed: false,
};

function setMocks({ shouldSucceed }: Required<SetNewPasswordArgs>) {
  mockedService.account.resetPassword = () =>
    shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("API error"));
}
