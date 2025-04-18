import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToProfile } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLanguages, getRegions, getUser } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

import EditProfilePage from "./EditProfilePage";

const { t } = i18n;

jest.mock("components/OldMap", () => () => "map");
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

const renderPage = async () => {
  act(() => render(<EditProfilePage />, { wrapper }));
};

describe("Edit profile", () => {
  beforeEach(() => {
    addDefaultUser();
    getRegionsMock.mockImplementation(getRegions);
    getLanguagesMock.mockImplementation(getLanguages);
  });

  it("Should update and redirect to the user profile page when aboutMe and avatar filled out on first go", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);
    const aboutMeText =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam. Ad nauseum.";

    getUserMock.mockImplementation(getUser);

    renderPage();

    const user = userEvent.setup();

    const aboutMeInput = await screen.findByLabelText(
      t("profile:heading.who_section"),
    );

    await user.clear(aboutMeInput);
    await user.type(aboutMeInput, aboutMeText);

    await waitFor(() => expect(aboutMeInput).toHaveValue(aboutMeText), {
      timeout: 5000,
    });

    await user.click(
      await screen.findByRole("button", { name: t("global:save") }),
    );

    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ aboutMe: aboutMeText }),
    );

    await waitFor(
      () => expect(mockRouter.pathname).toBe(routeToProfile("about")),
      { timeout: 5000 },
    );
  }, 8000);

  it(`should not submit the default headings for the '${t(
    "profile:heading.who_section",
  )}' and '${t("profile:heading.hobbies_section")}' sections`, async () => {
    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));
    renderPage();

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: t("global:save") }),
    );

    const saveAnywayButton = await screen.findByRole("button", {
      name: t("profile:incomplete_dialog.save_anyway"),
    });

    await user.click(saveAnywayButton);

    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("about")),
    );
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutMe: "",
        thingsILike: "",
      }),
    );
  });

  it("Should not update profile automatically if the user has not filled out aboutMe section besides deafault headers", async () => {
    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));

    await renderPage();

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: t("global:save") }),
    );

    const profileIncompleteDialog = await screen.findByTestId(
      "incomplete-profile-dialog",
    );

    expect(profileIncompleteDialog).toBeVisible();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });
});
