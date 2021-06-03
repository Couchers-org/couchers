import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HOBBIES, SAVE, WHO } from "features/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";
import { editUserRoute, userBaseRoute, userRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getLanguages, getRegions, getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import EditProfilePage from "./EditProfilePage";

jest.mock("components/Map", () => () => "map");
jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;

const getLanguagesMock = service.resources.getLanguages as jest.MockedFunction<
  typeof service.resources.getLanguages
>;

const getRegionsMock = service.resources.getRegions as jest.MockedFunction<
  typeof service.resources.getRegions
>;

const updateProfileMock = service.user.updateProfile as jest.MockedFunction<
  typeof service.user.updateProfile
>;

const renderPage = () => {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${userBaseRoute}/edit`],
  });

  render(
    <Switch>
      <Route path={editUserRoute}>
        <EditProfilePage />
      </Route>
      <Route path={userRoute}>
        <h1 data-testid="user-profile">Mock Profile Page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
};

describe("Edit profile", () => {
  beforeEach(() => {
    addDefaultUser();
    getUserMock.mockImplementation(getUser);
    getRegionsMock.mockImplementation(getRegions);
    getLanguagesMock.mockImplementation(getLanguages);
    updateProfileMock.mockResolvedValue(new Empty());
  });

  it("should redirect to the user profile page after a successful update", async () => {
    renderPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("button", { name: SAVE }));

    expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
  });

  it(`should not submit the default headings for the '${WHO}' and '${HOBBIES}' sections`, async () => {
    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));
    renderPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("button", { name: SAVE }));
    await screen.findByTestId("user-profile");
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutMe: "",
        thingsILike: "",
      })
    );
  });
});
