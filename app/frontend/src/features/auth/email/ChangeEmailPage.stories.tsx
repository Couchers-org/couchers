import { Meta, Story } from "@storybook/react";
import ChangeEmailPage from "features/auth/email/ChangeEmailPage";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetAccountInfoRes } from "pb/account_pb";
import React from "react";
import { mockedService } from "stories/__mocks__/service";

export default {
  component: ChangeEmailPage,
  title: "Me/Auth/ChangeEmailPage",
} as Meta;

interface ChangeEmailPageArgs {
  loginMethod?: GetAccountInfoRes.LoginMethod;
  simulateGetAccountInfoLoading?: boolean;
  shouldChangeEmailSucceed?: boolean;
  shouldGetAccountInfoSucceed?: boolean;
}

const Template: Story<ChangeEmailPageArgs> = ({
  loginMethod = GetAccountInfoRes.LoginMethod.PASSWORD,
  simulateGetAccountInfoLoading = false,
  shouldChangeEmailSucceed = true,
  shouldGetAccountInfoSucceed = true,
} = {}) => {
  setMocks({
    loginMethod,
    shouldChangeEmailSucceed,
    shouldGetAccountInfoSucceed,
    simulateGetAccountInfoLoading,
  });
  return <ChangeEmailPage />;
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
}: Required<ChangeEmailPageArgs>) {
  mockedService.account.getAccountInfo = () =>
    shouldGetAccountInfoSucceed
      ? simulateGetAccountInfoLoading
        ? new Promise(() => void 0)
        : Promise.resolve({
            hasPassword: loginMethod === GetAccountInfoRes.LoginMethod.PASSWORD,
            loginMethod,
          })
      : Promise.reject(new Error("Error getting account info"));
  mockedService.account.changeEmail = () =>
    shouldChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Error completing email change"));
}
