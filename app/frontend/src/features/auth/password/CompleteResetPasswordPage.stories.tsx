import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { MemoryRouter, Route } from "react-router-dom";

import { resetPasswordRoute } from "../../../routes";
import { mockedService } from "../../../stories/__mocks__/service";
import CompleteResetPasswordPage from "./CompleteResetPasswordPage";

export default {
  component: CompleteResetPasswordPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`${resetPasswordRoute}/token`]}>
        <Route path={`${resetPasswordRoute}/:resetToken`}>
          <Story />
        </Route>
        <Route path="/login">
          <p>Dummy login page</p>
        </Route>
      </MemoryRouter>
    ),
  ],
  title: "Me/Auth/CompleteResetPasswordPage",
} as Meta;

interface CompleteResetPasswordPageArgs {
  isLoading?: boolean;
  shouldSucceed?: boolean;
}

const Template: Story<CompleteResetPasswordPageArgs> = ({
  isLoading = false,
  shouldSucceed = true,
} = {}) => {
  setMocks({ isLoading, shouldSucceed });
  return <CompleteResetPasswordPage />;
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const Success = Template.bind({});

export const Failed = Template.bind({});
Failed.args = {
  shouldSucceed: false,
};

function setMocks({
  isLoading,
  shouldSucceed,
}: Required<CompleteResetPasswordPageArgs>) {
  mockedService.account.completePasswordReset = () =>
    isLoading
      ? new Promise(() => void 0)
      : shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Invalid token"));
}
