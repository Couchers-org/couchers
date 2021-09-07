import { Meta, Story } from "@storybook/react";
import { ConfirmChangeEmailRes, EmailConfirmationState } from "proto/auth_pb";
import { MemoryRouter, Route } from "react-router-dom";
import { confirmChangeEmailRoute } from "routes";
import { mockedService } from "stories/serviceMocks";

import ConfirmChangeEmail from "./ConfirmChangeEmail";

export default {
  component: ConfirmChangeEmail,
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

interface ConfirmChangeEmailArgs {
  isLoading?: boolean;
  resultState?: EmailConfirmationState | null;
}

const Template: Story<ConfirmChangeEmailArgs> = ({
  isLoading = false,
  resultState = null,
} = {}) => {
  setMocks({ isLoading, resultState });
  return <ConfirmChangeEmail />;
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const Success = Template.bind({});
Success.args = {
  resultState: EmailConfirmationState.EMAIL_CONFIRMATION_STATE_SUCCESS,
};

export const NeedNew = Template.bind({});
NeedNew.args = {
  resultState:
    EmailConfirmationState.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_NEW_EMAIL,
};

export const NeedOld = Template.bind({});
NeedOld.args = {
  resultState:
    EmailConfirmationState.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_OLD_EMAIL,
};

export const Failed = Template.bind({});
Failed.args = {
  resultState: null,
};

function setMocks({
  isLoading,
  resultState,
}: Required<ConfirmChangeEmailArgs>) {
  mockedService.account.confirmChangeEmail = () =>
    isLoading
      ? new Promise(() => void 0)
      : resultState
      ? Promise.resolve(
          new ConfirmChangeEmailRes().setState(resultState).toObject()
        )
      : Promise.reject(new Error("Invalid token"));
}
