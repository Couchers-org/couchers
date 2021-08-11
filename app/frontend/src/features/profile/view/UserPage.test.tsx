import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SECTION_LABELS } from "features/constants";
import useCurrentUser from "features/userQueries/useCurrentUser";
import type { Location } from "history";
import { User } from "proto/api_pb";
import { Route } from "react-router-dom";
import { routeToUser, userRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getLanguages, getRegions, getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import { MORE_PROFILE_ACTIONS_A11Y_TEXT } from "../constants";
import UserPage from "./UserPage";

jest.mock("features/userQueries/useCurrentUser");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

const getLanguagesMock = service.resources.getLanguages as jest.MockedFunction<
  typeof service.resources.getLanguages
>;

const getRegionsMock = service.resources.getRegions as jest.MockedFunction<
  typeof service.resources.getRegions
>;

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

let testLocation: Location;
function renderUserPage(username: string) {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [routeToUser(username)],
  });

  render(
    <>
      <Route path={userRoute}>
        <UserPage />
      </Route>
      <Route
        path="*"
        render={({ location }) => {
          testLocation = location;
          return null;
        }}
      />
    </>,
    { wrapper }
  );
}

describe("User page", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getLanguagesMock.mockImplementation(getLanguages);
    getRegionsMock.mockImplementation(getRegions);
    addDefaultUser();
  });

  describe("when viewing the current user's profile", () => {
    beforeEach(() => {
      useCurrentUserMock.mockReturnValue({
        data: {
          username: "funnycat",
        } as User.AsObject,
        isError: false,
        isLoading: false,
        isFetching: false,
        error: "",
      });
    });

    it("does not show the button for opening a profile actions menu (viewed with username)", async () => {
      renderUserPage("funnycat");

      expect(
        await screen.findByRole("heading", { name: "Funny Cat current User" })
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: MORE_PROFILE_ACTIONS_A11Y_TEXT })
      ).not.toBeInTheDocument();
    });

    describe("and a tab is opened", () => {
      it("updates the url with the chosen tab value", async () => {
        renderUserPage("funnycat");

        expect(testLocation.pathname).toBe("/user/funnycat");

        userEvent.click(await screen.findByText(SECTION_LABELS.home));

        expect(testLocation.pathname).toBe("/user/funnycat/home");

        userEvent.click(await screen.findByText(SECTION_LABELS.about));

        expect(testLocation.pathname).toBe("/user/funnycat/about");
      });
    });
  });

  describe("when viewing another user's profile", () => {
    beforeEach(() => {
      renderUserPage("funnydog");
    });

    it("shows the button for opening a profile actions menu", async () => {
      expect(
        await screen.findByRole("heading", { name: "Funny Dog" })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: MORE_PROFILE_ACTIONS_A11Y_TEXT })
      ).toBeVisible();
    });

    describe("and a tab is opened", () => {
      it("updates the url with the chosen tab value", async () => {
        expect(testLocation.pathname).toBe("/user/funnydog");

        userEvent.click(await screen.findByText(SECTION_LABELS.home));

        expect(testLocation.pathname).toBe("/user/funnydog/home");

        userEvent.click(await screen.findByText(SECTION_LABELS.about));

        expect(testLocation.pathname).toBe("/user/funnydog/about");
      });
    });
  });
});
