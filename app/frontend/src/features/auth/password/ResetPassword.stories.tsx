import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { mockedService } from "stories/__mocks__/service";

import ResetPassword from "./ResetPassword";

export default {
  title: "Me/Auth/ResetPassword",
  component: ResetPassword,
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
