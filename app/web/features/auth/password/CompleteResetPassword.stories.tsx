import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { mockedService } from "stories/serviceMocks";

import CompleteResetPassword from "./CompleteResetPassword";

export default {
  component: CompleteResetPassword,
  title: "Me/Auth/CompleteResetPasswordPage",
} as Meta;

interface CompleteResetPasswordArgs {
  shouldSucceed?: boolean;
}

const Template: Story<CompleteResetPasswordArgs> = ({
  shouldSucceed = true,
} = {}) => {
  setMocks({ shouldSucceed });
  return <CompleteResetPassword />;
};

export const Success = Template.bind({});

export const Failed = Template.bind({});
Failed.args = {
  shouldSucceed: false,
};

function setMocks({ shouldSucceed }: Required<CompleteResetPasswordArgs>) {
  mockedService.account.resetPassword = () =>
    shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("API error"));
}
