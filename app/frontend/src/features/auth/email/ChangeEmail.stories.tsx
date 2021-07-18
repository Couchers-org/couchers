import { Meta, Story } from "@storybook/react";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";
import { mockedService } from "stories/serviceMocks";

export default {
  component: ChangeEmail,
  title: "Me/Auth/ChangeEmailPage",
} as Meta;

interface ChangeEmailArgs {
  loginMethod?: GetAccountInfoRes.LoginMethod;
  simulateGetAccountInfoLoading?: boolean;
  shouldChangeEmailSucceed?: boolean;
  shouldGetAccountInfoSucceed?: boolean;
  accountInfo?: GetAccountInfoRes.AsObject;
}

const Template: Story<ChangeEmailArgs> = ({
  loginMethod = GetAccountInfoRes.LoginMethod.PASSWORD,
  simulateGetAccountInfoLoading = false,
  shouldChangeEmailSucceed = true,
  shouldGetAccountInfoSucceed = true,
  accountInfo = {
    loginMethod,
    hasPassword: true,
  } as GetAccountInfoRes.AsObject,
} = {}) => {
  setMocks({
    loginMethod,
    simulateGetAccountInfoLoading,
    shouldChangeEmailSucceed,
    shouldGetAccountInfoSucceed,
    accountInfo,
  });
  return <ChangeEmail {...accountInfo} />;
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

export const ErrorChangingEmail = Template.bind({});
ErrorChangingEmail.args = {
  shouldChangeEmailSucceed: false,
};

export const ErrorChangingEmail2 = Template.bind({});
ErrorChangingEmail2.storyName = "Error Changing Email (without password)";
ErrorChangingEmail2.args = {
  loginMethod: GetAccountInfoRes.LoginMethod.MAGIC_LINK,
  shouldChangeEmailSucceed: false,
};

function setMocks({
  loginMethod,
  simulateGetAccountInfoLoading,
  shouldChangeEmailSucceed,
  shouldGetAccountInfoSucceed,
}: Required<ChangeEmailArgs>) {
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
            phone: "+46701740605",
            timezone: "Australia/Melbourne",
          })
      : Promise.reject(new Error("Error getting account info"));
  mockedService.account.changeEmail = () =>
    shouldChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Error completing email change"));
}
