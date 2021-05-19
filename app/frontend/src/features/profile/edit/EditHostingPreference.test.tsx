import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";
import { routeToEditUser, routeToUser } from "routes";
import { service } from "service";
import users from "test/fixtures/users.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import { SAVE } from "../../constants";
import EditHostingPreferences from "./EditHostingPreference";

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

const user = users[0];

const renderPage = () => {
  const editHostingPreferencesRoute = `${routeToEditUser("home")}`;
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [editHostingPreferencesRoute],
  });

  render(
    <Switch>
      <Route path={editHostingPreferencesRoute}>
        <EditHostingPreferences />
      </Route>
      <Route path={routeToUser(user.username, "home")}>
        <h1 data-testid="user-profile">Mock Profile Page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
};

describe("EditHostingPreference", () => {
  beforeEach(() => {
    addDefaultUser();
    getUserMock.mockImplementation(getUser);
    updateHostingPreferenceMock.mockResolvedValue(new Empty());
  });

  it("should redirect to the user profile route with 'home' tab active after successful update", async () => {
    renderPage();

    userEvent.click(await screen.findByRole("button", { name: SAVE }));

    expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
  }, 20000);
});
