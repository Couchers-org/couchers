import { Meta, Story } from "@storybook/react";
import ChangePassword from "features/auth/password/ChangePassword";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";
import { mockedService } from "stories/serviceMocks";

export default {
  component: ChangePassword,
  title: "Me/Auth/ChangePasswordPage",
} as Meta;

interface ChangePasswordArgs {
  loginMethod?: GetAccountInfoRes.LoginMethod;
  simulateGetAccountInfoLoading?: boolean;
  shouldChangePasswordSucceed?: boolean;
  shouldGetAccountInfoSucceed?: boolean;
  accountInfo?: GetAccountInfoRes.AsObject;
}

const Template: Story<ChangePasswordArgs> = ({
  loginMethod = GetAccountInfoRes.LoginMethod.PASSWORD,
  simulateGetAccountInfoLoading = false,
  shouldChangePasswordSucceed = true,
  shouldGetAccountInfoSucceed = true,
  accountInfo = {
    loginMethod,
    hasPassword: true,
  } as GetAccountInfoRes.AsObject,
} = {}) => {
  setMocks({
    loginMethod,
    simulateGetAccountInfoLoading,
    shouldChangePasswordSucceed,
    shouldGetAccountInfoSucceed,
    accountInfo,
  });
  return <ChangePassword {...accountInfo} />;
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
}: Required<ChangePasswordArgs>) {
  mockedService.account.getAccountInfo = () =>
    shouldGetAccountInfoSucceed
      ? simulateGetAccountInfoLoading
        ? new Promise(() => void 0)
        : Promise.resolve({
            hasPassword: loginMethod === GetAccountInfoRes.LoginMethod.PASSWORD,
            loginMethod,
            username: "tester",
            email: "user@couchers.invalid",
            profileComplete: true,
            phone: "",
            timezone: "America/New_York",
          })
      : Promise.reject(new Error("Error getting account info"));
  mockedService.account.changePassword = () =>
    shouldChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Error completing password change"));
}
