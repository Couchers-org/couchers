import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { MemoryRouter, Route } from "react-router-dom";

import { confirmChangeEmailRoute } from "../../../routes";
import { mockedService } from "../../../stories/__mocks__/service";
import ConfirmChangeEmailPage from "./ConfirmChangeEmailPage";

export default {
  component: ConfirmChangeEmailPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`${confirmChangeEmailRoute}/token`]}>
        <Route path={`${confirmChangeEmailRoute}/:resetToken`}>
          <Story />
        </Route>
        <Route path="/login">
          <p>Dummy login page</p>
        </Route>
      </MemoryRouter>
    ),
  ],
  title: "Me/Auth/ConfirmChangeEmailPage",
} as Meta;

interface ConfirmChangeEmailPageArgs {
  isLoading?: boolean;
  shouldSucceed?: boolean;
}

const Template: Story<ConfirmChangeEmailPageArgs> = ({
  isLoading = false,
  shouldSucceed = true,
} = {}) => {
  setMocks({ isLoading, shouldSucceed });
  return <ConfirmChangeEmailPage />;
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
}: Required<ConfirmChangeEmailPageArgs>) {
  mockedService.account.completeChangeEmail = () =>
    isLoading
      ? new Promise(() => void 0)
      : shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Invalid token"));
}
