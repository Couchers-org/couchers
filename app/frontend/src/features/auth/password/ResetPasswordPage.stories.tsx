import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";

import { mockedService } from "../../../stories/__mocks__/service";
import ResetPasswordPage from "./ResetPasswordPage";

export default {
  component: ResetPasswordPage,
  title: "Me/Auth/ResetPasswordPage",
} as Meta;

interface ResetPasswordPageArgs {
  shouldSucceed?: boolean;
}

const Template: Story<ResetPasswordPageArgs> = ({
  shouldSucceed = true,
} = {}) => {
  setMocks({ shouldSucceed });
  return <ResetPasswordPage />;
};

export const Success = Template.bind({});

export const Failed = Template.bind({});
Failed.args = {
  shouldSucceed: false,
};

function setMocks({ shouldSucceed }: Required<ResetPasswordPageArgs>) {
  mockedService.account.resetPassword = () =>
    shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("API error"));
}
