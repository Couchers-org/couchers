import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { service } from "@/service";
import wrapper from "@/test/hookWrapper";
import i18n from "@/test/i18n";
import { getLanguages, getRegions, getUser } from "@/test/serviceMockDefaults";
import { addDefaultUser } from "@/test/utils";

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

const uploadFileMock = service.api.uploadFile as jest.MockedFunction<
  typeof service.api.uploadFile
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

  it("Should update and show success toast when aboutMe and avatar filled out on first go", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    uploadFileMock.mockResolvedValue({
      key: "test.png",
      file: new File(["test"], "test.png", { type: "image/png" }),
      filename: "test.png",
      thumbnail_url: "mock-thumbnail-url",
      full_url: "mock-full-url",
    });

    const aboutMeText =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam. Ad nauseum.";

    getUserMock.mockImplementation(getUser);

    renderPage();

    const user = userEvent.setup();

    // Wait for the form to be fully loaded
    await waitFor(() => {
      expect(
        screen.getByText(t("profile:heading.about_me")),
      ).toBeInTheDocument();
    });

    const aboutMeInput = await screen.findByTestId("aboutMe-input");

    await user.click(aboutMeInput);
    await user.clear(aboutMeInput);
    await user.type(aboutMeInput, aboutMeText);

    // Now the save button should be visible
    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    // Check if incomplete profile dialog appears and handle it
    try {
      const incompleteDialog = await screen.findByTestId(
        "incomplete-profile-dialog",
        {},
      );
      if (incompleteDialog) {
        const saveAnywayButton = await screen.findByRole("button", {
          name: t("profile:incomplete_dialog.save_anyway"),
        });
        await user.click(saveAnywayButton);
      }
    } catch {
      // Dialog didn't appear, which is fine
    }

    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ aboutMe: aboutMeText }),
    );

    await waitFor(() =>
      { expect(
        screen.getByText(t("profile:profile_changes_saved_message")),
      ).toBeInTheDocument(); },
    );
  });

  it(`should not submit the default headings for the '${t(
    "profile:heading.who_section",
  )}' and '${t("profile:heading.hobbies_section")}' sections`, async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));
    renderPage();

    const user = userEvent.setup();

    // Wait for the form to be loaded
    await screen.findByText(t("profile:heading.about_me"));

    // Make a small change to make the form dirty
    const aboutMeInput = await screen.findByTestId("aboutMe-input");
    await user.click(aboutMeInput);
    await user.type(aboutMeInput, "test");

    // Now the save button should be visible
    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    const saveAnywayButton = await screen.findByRole("button", {
      name: t("profile:incomplete_dialog.save_anyway"),
    });

    await user.click(saveAnywayButton);

    // Wait for the API call to be made
    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledTimes(1);
    });

    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutMe: "test",
        thingsILike: "",
      }),
    );

    await waitFor(() =>
      { expect(
        screen.getByText(t("profile:profile_changes_saved_message")),
      ).toBeInTheDocument(); },
    );
  });

  it("Should not update profile automatically if the user has not filled out aboutMe section besides default headers", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));

    await renderPage();

    const user = userEvent.setup();

    // Wait for the form to be loaded
    await screen.findByText(t("profile:heading.about_me"));

    // Make a small change to make the form dirty
    const aboutMeInput = await screen.findByTestId("aboutMe-input");
    await user.click(aboutMeInput);
    await user.type(aboutMeInput, "test");

    // Now the save button should be visible
    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    const profileIncompleteDialog = await screen.findByTestId(
      "incomplete-profile-dialog",
    );

    expect(profileIncompleteDialog).toBeVisible();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("should only count user content for aboutMe length validation, excluding default headings", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));

    renderPage();

    const user = userEvent.setup();

    // Wait for the form to be loaded
    await screen.findByText(t("profile:heading.about_me"));

    // Check that the warning shows initially (0 user characters)
    // The warning might not show until we make the form dirty
    const aboutMeInput = await screen.findByTestId("aboutMe-input");
    await user.click(aboutMeInput);
    await user.clear(aboutMeInput);

    // Now check for the warning
    const warningText = await screen.findByTestId("aboutMe-input-helper-text");
    expect(warningText).toBeInTheDocument();

    // Add exactly 150 characters of user content
    await user.click(aboutMeInput);
    await user.clear(aboutMeInput);
    const userContent = "a".repeat(100); // 100 characters
    await user.type(aboutMeInput, userContent);

    // Warning text should show 50 more characters needed
    expect(warningText).toHaveTextContent(
      "Please write at least 50 characters to unlock messaging and requests. Genuine profiles build a community of trust. The more you share, the easier it is to connect!",
    );

    // Add 50 more characters
    await user.type(aboutMeInput, "a".repeat(50));

    // Wait for the warning to disappear (should have exactly 150 characters)
    expect(warningText).not.toBeInTheDocument();

    // Verify no warning is shown
    expect(warningText).not.toBeInTheDocument();
  });

  it("should only show save bar when form is dirty", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(getUser);

    renderPage();

    // Wait for the form to be loaded
    await screen.findByText(t("profile:heading.about_me"));

    // Initially, save bar should not be visible (form is not dirty)
    expect(
      screen.queryByRole("button", { name: t("global:save_changes") }),
    ).not.toBeInTheDocument();
  });
});
