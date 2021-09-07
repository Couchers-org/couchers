import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SECTION_LABELS } from "features/constants";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import type { Location } from "history";
import { Route } from "react-router-dom";
import { profileRoute, routeToProfile } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getLanguages, getRegions, getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import ProfilePage from "./ProfilePage";

jest.mock("features/userQueries/useCurrentUser");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const reportContentMock = service.reporting.reportContent as MockedService<
  typeof service.reporting.reportContent
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
function renderProfilePage() {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [routeToProfile()],
  });

  render(
    <>
      <Route path={profileRoute}>
        <ProfilePage />
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

describe("Profile page", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getLanguagesMock.mockImplementation(getLanguages);
    getRegionsMock.mockImplementation(getRegions);
    reportContentMock.mockResolvedValue(new Empty());
    addDefaultUser();
  });

  describe("when viewing the current user's profile", () => {
    beforeEach(() => {
      useCurrentUserMock.mockReturnValue({
        data: defaultUser,
        isError: false,
        isLoading: false,
        isFetching: false,
        error: "",
      });
    });

    describe("and a tab is opened", () => {
      it("updates the url with the chosen tab value", async () => {
        renderProfilePage();

        expect(testLocation.pathname).toBe("/profile");

        userEvent.click(await screen.findByText(SECTION_LABELS.home));

        expect(testLocation.pathname).toBe("/profile/home");

        userEvent.click(await screen.findByText(SECTION_LABELS.about));

        expect(testLocation.pathname).toBe("/profile/about");
      });
    });
  });
});
