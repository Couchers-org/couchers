import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";
import { editHostingPreferenceRoute, userRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import {
  ACCEPT_SMOKING,
  HOSTING_PREFERENCES,
  PARKING_DETAILS,
  SAVE,
  SPACE,
} from "../../constants";
import EditHostingPreference from "./EditHostingPreference";

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

const renderPage = () => {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${editHostingPreferenceRoute}`],
  });

  render(
    <Switch>
      <Route path={editHostingPreferenceRoute}>
        <EditHostingPreference />
      </Route>
      <Route path={userRoute}>
        <h1 data-testid="user-profile">Mock Profile Page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
};

describe("EditHostingPreference", () => {
  beforeEach(() => {
    addDefaultUser(1);
    getUserMock.mockImplementation(getUser);
    updateHostingPreferenceMock.mockResolvedValue(new Empty());
  });

  it("should redirect to the user profile route after successful update", async () => {
    renderPage();

    userEvent.click(await screen.findByRole("button", { name: SAVE }));

    expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
  }, 20000);

  it("should display the users hosting preferences", async () => {
    renderPage();

    await screen.findByText(HOSTING_PREFERENCES);

    expect(
      (await screen.findByLabelText(ACCEPT_SMOKING)) as HTMLSelectElement
    ).toHaveValue("1");

    expect(
      (await screen.findByLabelText(PARKING_DETAILS)) as HTMLSelectElement
    ).toHaveValue("3");

    expect(
      (await screen.findByLabelText(SPACE)) as HTMLSelectElement
    ).toHaveValue("2");
  });
});
