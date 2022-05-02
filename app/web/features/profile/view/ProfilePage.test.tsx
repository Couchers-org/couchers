import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SECTION_LABELS } from "features/profile/constants";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { service } from "service";
import wrapper from "test/hookWrapper";
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

function renderProfilePage() {
  mockRouter.setCurrentUrl("/profile");
  render(<ProfilePage tab="about" />, { wrapper });
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

        expect(mockRouter.pathname).toBe("/profile");

        await userEvent.click(await screen.findByText(SECTION_LABELS.home));

        expect(mockRouter.pathname).toBe("/profile/home");

        await userEvent.click(await screen.findByText(SECTION_LABELS.about));

        expect(mockRouter.pathname).toBe("/profile/about");
      });
    });
  });
});
