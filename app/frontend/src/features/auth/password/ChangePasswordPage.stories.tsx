import { Meta, Story } from "@storybook/react";
import ChangePasswordPage from "features/auth/password/ChangePasswordPage";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "pb/account_pb";
import React from "react";
import { mockedService } from "stories/__mocks__/service";

export default {
  component: ChangePasswordPage,
  title: "Me/Auth/ChangePasswordPage",
} as Meta;

interface ChangePasswordPageArgs {
  loginMethod?: GetAccountInfoRes.LoginMethod;
  simulateGetAccountInfoLoading?: boolean;
  shouldChangePasswordSucceed?: boolean;
  shouldGetAccountInfoSucceed?: boolean;
}

const Template: Story<ChangePasswordPageArgs> = ({
  loginMethod = GetAccountInfoRes.LoginMethod.PASSWORD,
  simulateGetAccountInfoLoading = false,
  shouldChangePasswordSucceed = true,
  shouldGetAccountInfoSucceed = true,
} = {}) => {
  setMocks({
    loginMethod,
    shouldChangePasswordSucceed,
    shouldGetAccountInfoSucceed,
    simulateGetAccountInfoLoading,
  });
  return <ChangePasswordPage />;
};

export const HasPassword = Template.bind({});

export const NoPassword = Template.bind({});
NoPassword.args = {
  loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
};

export const AccountInfoLoading = Template.bind({});
AccountInfoLoading.args = {
  simulateGetAccountInfoLoading: true,
};

export const ErrorGettingAccountInfo = Template.bind({});
ErrorGettingAccountInfo.args = {
  shouldGetAccountInfoSucceed: false,
};

export const ErrorChangingPassword = Template.bind({});
ErrorChangingPassword.args = {
  shouldChangePasswordSucceed: false,
};

export const ErrorChangingPassword2 = Template.bind({});
ErrorChangingPassword2.storyName = "Error Changing Password (without password)";
ErrorChangingPassword2.args = {
  loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
  shouldChangePasswordSucceed: false,
};

function setMocks({
  loginMethod,
  simulateGetAccountInfoLoading,
  shouldChangePasswordSucceed: shouldChangeEmailSucceed,
  shouldGetAccountInfoSucceed,
}: Required<ChangePasswordPageArgs>) {
  mockedService.account.getAccountInfo = () =>
    shouldGetAccountInfoSucceed
      ? simulateGetAccountInfoLoading
        ? new Promise(() => void 0)
        : Promise.resolve({
            hasPassword: loginMethod === GetAccountInfoRes.LoginMethod.PASSWORD,
            loginMethod,
          })
      : Promise.reject(new Error("Error getting account info"));
  mockedService.account.changePassword = () =>
    shouldChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Error completing password change"));
}
