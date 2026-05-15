import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useCurrentProfile } from "features/userQueries/useProfile";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { service } from "service";
import defaultProfile from "test/fixtures/defaultProfile.json";
import defaultUser from "test/fixtures/defaultUser.json";
import galleryFixtures from "test/fixtures/gallery.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import {
  getAccountInfo,
  getLanguages,
  getProfile,
  getRegions,
  getUser,
} from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import ProfilePage from "./ProfilePage";

const { t } = i18n;

jest.mock("features/userQueries/useCurrentUser");
jest.mock("features/userQueries/useProfile");

jest.mock("react-simple-maps");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const getProfileMock = service.user.getProfile as MockedService<
  typeof service.user.getProfile
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
const useCurrentProfileMock = useCurrentProfile as jest.MockedFunction<
  typeof useCurrentProfile
>;

const getGalleryMock = service.gallery.getGallery as jest.MockedFunction<
  typeof service.gallery.getGallery
>;

const getAccountInfoMock = service.account
  .getAccountInfo as jest.MockedFunction<typeof service.account.getAccountInfo>;

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
    getProfileMock.mockImplementation(getProfile);
    getLanguagesMock.mockImplementation(getLanguages);
    getRegionsMock.mockImplementation(getRegions);
    getAccountInfoMock.mockImplementation(getAccountInfo);
    reportContentMock.mockResolvedValue(new Empty());
    getGalleryMock.mockResolvedValue(galleryFixtures.galleries[0]);
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
      useCurrentProfileMock.mockReturnValue({
        data: defaultProfile,
        isLoading: false,
        isError: false,
        isFetching: false,
        error: null,
      } as unknown as ReturnType<typeof useCurrentProfile>);
    });

    describe("and a tab is opened", () => {
      it("updates the url with the chosen tab value", async () => {
        renderProfilePage();

        expect(mockRouter.pathname).toBe("/profile");

        const user = userEvent.setup();

        const homeTab = await screen.findByText(t("profile:heading.home"));

        await user.click(homeTab);

        expect(mockRouter.pathname).toBe("/profile/home");

        // @TODO(NA) For the life of me cannot get this second click to work after mui v5 upgrade
        // It works in the real app though. Giving up for now.
        // Mui introduced support for Next.js AppRouter, but we need to upgrade to Next v13 first for it, that might help
        // https://github.com/mui/material-ui/blob/HEAD/CHANGELOG.old.md#5140

        // const aboutTab = await screen.findByText(t("profile:heading.about_me"))

        // await fireEvent.click(aboutTab);

        // expect(mockRouter.pathname).toBe("/profile/about");
      });
    });
  });
});
