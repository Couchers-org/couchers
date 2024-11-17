import { Meta, Story } from "@storybook/react";
import ChangeEmail from "features/auth/email/ChangeEmail";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { mockedService } from "stories/serviceMocks";

export default {
  component: ChangeEmail,
  title: "Me/Auth/ChangeEmailPage",
} as Meta;

interface ChangeEmailArgs {
  simulateGetAccountInfoLoading?: boolean;
  shouldChangeEmailSucceed?: boolean;
  shouldGetAccountInfoSucceed?: boolean;
}

const Template: Story<ChangeEmailArgs> = ({
  simulateGetAccountInfoLoading = false,
  shouldChangeEmailSucceed = true,
  shouldGetAccountInfoSucceed = true,
} = {}) => {
  setMocks({
    simulateGetAccountInfoLoading,
    shouldChangeEmailSucceed,
    shouldGetAccountInfoSucceed,
  });
  return <ChangeEmail email={"user@couchers.invalid"} />;
};

export const Normal = Template.bind({});

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

function setMocks({
  simulateGetAccountInfoLoading,
  shouldChangeEmailSucceed,
  shouldGetAccountInfoSucceed,
}: Required<ChangeEmailArgs>) {
  mockedService.account.getAccountInfo = () =>
    shouldGetAccountInfoSucceed
      ? simulateGetAccountInfoLoading
        ? new Promise(() => void 0)
        : Promise.resolve({
            username: "tester",
            email: "user@couchers.invalid",
            profileComplete: true,
            phone: "+46701740605",
            phoneVerified: true,
            timezone: "Australia/Melbourne",
            hasStrongVerification: true,
            birthdateVerificationStatus: 2,
            genderVerificationStatus: 2,
            doNotEmail: false,
            hasDonated: false,
            isSuperuser: false,
          })
      : Promise.reject(new Error("Error getting account info"));
  mockedService.account.changeEmail = () =>
    shouldChangeEmailSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Error completing email change"));
}
