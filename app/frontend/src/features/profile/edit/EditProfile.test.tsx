import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HOBBIES, SAVE, WHO } from "features/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";
import { editProfileRoute, userRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

jest.mock("components/Map", () => () => "map");

const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;
const updateProfileMock = service.user.updateProfile as jest.MockedFunction<
  typeof service.user.updateProfile
>;

const renderPage = (Component: () => JSX.Element) => {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${editProfileRoute}`],
  });

  render(
    <Switch>
      <Route path={editProfileRoute}>
        <Component />
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
    updateProfileMock.mockResolvedValue(new Empty());
  });

  it("should redirect to the user profile page after a successful update", async () => {
    jest.isolateModules(() => {
      jest.mock("components/MarkdownInput");
      const EditProfile = require("./EditProfile").default;
      renderPage(EditProfile);
    });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("button", { name: SAVE }));

    expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
  });

  it(`should not submit the default headings for the '${WHO}' and '${HOBBIES}' sections`, async () => {
    jest.isolateModules(() => {
      jest.unmock("components/MarkdownInput");
      getUserMock.mockImplementation(async (user) => ({
        ...(await getUser(user)),
        aboutMe: "",
        thingsILike: "",
      }));
      const EditProfile = require("./EditProfile").default;
      renderPage(EditProfile);
    });
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    const whoIAmTextField = within(screen.getByLabelText(WHO));
    const hobbiesTextField = within(screen.getByLabelText(HOBBIES));
    [
      "Current mission",
      "Why I use Couchers",
      "My favourite travel story",
    ].forEach((heading) => {
      expect(
        whoIAmTextField.getByRole("heading", { name: heading })
      ).toBeVisible();
    });
    ["Art", "Books", "Movies", "Music"].forEach((heading) => {
      expect(
        hobbiesTextField.getByRole("heading", { name: heading })
      ).toBeVisible();
    });

    userEvent.click(screen.getByRole("button", { name: SAVE }));
    await screen.findByTestId("user-profile");
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutMe: "",
        thingsILike: "",
      })
    );
  }, 20000);
});
