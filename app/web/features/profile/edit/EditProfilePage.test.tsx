import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const uploadFileMock = service.api.uploadFile as jest.MockedFunction<
  typeof service.api.uploadFile
>;

const renderPage = async () => {
  const result = render(<EditProfilePage />, { wrapper });
  // Wait for initial render to complete
  await screen.findByText(t("profile:heading.about_me"));
  return result;
};

describe("Edit profile", () => {
  beforeEach(() => {
    addDefaultUser();
    getRegionsMock.mockImplementation(getRegions);
    getLanguagesMock.mockImplementation(getLanguages);
  });

  afterEach(() => {
    updateProfileMock.mockClear();
    getUserMock.mockClear();
    uploadFileMock.mockClear();
  });

  it("Should update and show success toast when aboutMe and avatar filled out on first go", async () => {
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

    await renderPage();

    const user = userEvent.setup();

    const aboutMeInput = await screen.findByTestId("aboutMe-input");

    await user.clear(aboutMeInput);
    await waitFor(() => expect(aboutMeInput).toHaveValue(""));
    await user.type(aboutMeInput, aboutMeText);

    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    if (screen.queryByRole("dialog")) {
      const saveAnywayButton = await screen.findByRole("button", {
        name: t("profile:incomplete_dialog.save_anyway"),
      });
      await user.click(saveAnywayButton);
    }

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({ aboutMe: aboutMeText }),
      ),
    );

    await screen.findByText(t("profile:profile_changes_saved_message"));
  }, 20000);

  it(`should not submit the default headings for the '${t(
    "profile:heading.who_section",
  )}' and '${t("profile:heading.hobbies_section")}' sections`, async () => {
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));
    await renderPage();

    const user = userEvent.setup();

    const aboutMeInput = await screen.findByTestId("aboutMe-input");

    await user.clear(aboutMeInput);
    await waitFor(() => expect(aboutMeInput).toHaveValue(""));
    await user.type(aboutMeInput, "test");

    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    const saveAnywayButton = await screen.findByRole("button", {
      name: t("profile:incomplete_dialog.save_anyway"),
    });
    await user.click(saveAnywayButton);

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledTimes(1);
    });

    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutMe: "test",
        thingsILike: "",
      }),
    );

    await screen.findByText(t("profile:profile_changes_saved_message"));
  });

  it("Should not update profile automatically if the user has not filled out aboutMe section besides default headers", async () => {
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));

    await renderPage();

    const user = userEvent.setup();

    const aboutMeInput = await screen.findByTestId("aboutMe-input");

    await user.clear(aboutMeInput);
    await waitFor(() => expect(aboutMeInput).toHaveValue(""));
    await user.type(aboutMeInput, "test");

    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    await screen.findByRole("dialog");

    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("should only count user content for aboutMe length validation, excluding default headings", async () => {
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutMe: "",
      thingsILike: "",
    }));

    await renderPage();

    const user = userEvent.setup();

    await screen.findByText(t("profile:heading.about_me"));

    const aboutMeInput = await screen.findByTestId("aboutMe-input");

    await user.clear(aboutMeInput);
    await waitFor(() => expect(aboutMeInput).toHaveValue(""));

    // Use paste instead of type for large text - much faster
    const userContent = "a".repeat(100);
    await user.click(aboutMeInput);
    await user.paste(userContent);

    expect(
      await screen.findByText(
        /Please write at least 50 more characters to unlock messaging and requests/i,
      ),
    ).toBeInTheDocument();

    const additionalContent = "a".repeat(50);
    await user.paste(additionalContent);

    await waitFor(() => {
      expect(
        screen.queryByText(
          /Please write at least 50 more characters to unlock messaging and requests/i,
        ),
      ).not.toBeInTheDocument();
    });
  }, 10000);

  it("should reject names with invalid characters like !@#$", async () => {
    getUserMock.mockImplementation(getUser);

    await renderPage();

    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText(
      t("profile:edit_profile_headings.name"),
    );

    await user.clear(nameInput);
    await user.type(nameInput, "John!@#$");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(t("auth:basic_form.name.invalid_characters_error")),
      ).toBeInTheDocument();
    });

    await user.click(
      await screen.findByRole("button", { name: t("global:save_changes") }),
    );

    await waitFor(() => {
      expect(updateProfileMock).not.toHaveBeenCalled();
    });
  });

  it("should only show save bar when form is dirty", async () => {
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(getUser);

    await renderPage();

    expect(
      screen.queryByRole("button", { name: t("global:save_changes") }),
    ).not.toBeInTheDocument();
  });
});
