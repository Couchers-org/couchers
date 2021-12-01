import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";
import { routeToEditProfile, routeToProfile } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import {
  ABOUT_HOME,
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
  const editHostingPreferencesRoute = `${routeToEditProfile("home")}`;
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [editHostingPreferencesRoute],
  });

  render(
    <Switch>
      <Route path={editHostingPreferencesRoute}>
        <EditHostingPreference />
      </Route>
      <Route path={routeToProfile("home")}>
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

  it("should redirect to the user profile route with 'home' tab active after successful update", async () => {
    renderPage();

    userEvent.click(await screen.findByRole("button", { name: SAVE }));

    expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
  });

  it(`should not submit the default headings for the '${ABOUT_HOME}'section`, async () => {
    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutPlace: "",
    }));
    renderPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("button", { name: SAVE }));
    await screen.findByTestId("user-profile");

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutPlace: "",
      })
    );
  });

  it("should display the users hosting preferences", async () => {
    renderPage();

    await screen.findByText(HOSTING_PREFERENCES);

    expect(
      screen.getByLabelText(ACCEPT_SMOKING) as HTMLSelectElement
    ).toHaveValue("1");

    expect(
      screen.getByLabelText(PARKING_DETAILS) as HTMLSelectElement
    ).toHaveValue("3");

    expect(screen.getByLabelText(SPACE) as HTMLSelectElement).toHaveValue("2");
  });
});
