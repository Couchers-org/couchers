import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { mockedService } from "stories/serviceMocks";

import ResetPassword from "./ResetPassword";

export default {
  component: ResetPassword,
  title: "Me/Auth/ResetPasswordPage",
} as Meta;

interface ResetPasswordArgs {
  shouldSucceed?: boolean;
}

const Template: Story<ResetPasswordArgs> = ({ shouldSucceed = true } = {}) => {
  setMocks({ shouldSucceed });
  return <ResetPassword />;
};

export const Success = Template.bind({});

export const Failed = Template.bind({});
Failed.args = {
  shouldSucceed: false,
};

function setMocks({ shouldSucceed }: Required<ResetPasswordArgs>) {
  mockedService.account.resetPassword = () =>
    shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("API error"));
}
