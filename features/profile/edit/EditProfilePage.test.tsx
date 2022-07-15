import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { routeToProfile } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getLanguages, getRegions, getUser } from "test/serviceMockDefaults";
import { addDefaultUser, t } from "test/utils";

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
  render(<EditProfilePage />, { wrapper });
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

    userEvent.click(screen.getByRole("button", { name: t("global:save") }));

    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("about"))
    );
  });

  it(`should not submit the default headings for the '${t(
    "profile:heading.who_section"
  )}' and '${t("profile:heading.hobbies_section")}' sections`, async () => {
    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));
    renderPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("button", { name: t("global:save") }));
    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("about"))
    );
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutMe: "",
        thingsILike: "",
      })
    );
  });
});
