import { Meta, Story } from "@storybook/react";
import ChangePassword from "features/auth/password/ChangePassword";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { mockedService } from "stories/serviceMocks";

export default {
  component: ChangePassword,
  title: "Me/Auth/ChangePasswordPage",
} as Meta;

interface ChangePasswordArgs {
  shouldChangePasswordSucceed?: boolean;
}

const Template: Story<ChangePasswordArgs> = ({
  shouldChangePasswordSucceed = true,
} = {}) => {
  setMocks({
    shouldChangePasswordSucceed,
  });
  return <ChangePassword />;
};

export const Normal = Template.bind({});

export const ErrorChangingPassword = Template.bind({});
ErrorChangingPassword.args = {
  shouldChangePasswordSucceed: false,
};

function setMocks({
  shouldChangePasswordSucceed: shouldChangeEmailSucceed,
}: Required<ChangePasswordArgs>) {
  mockedService.account.changePassword = () =>
    shouldChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Error completing password change"));
}
