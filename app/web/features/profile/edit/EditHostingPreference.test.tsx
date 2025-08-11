import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { routeToProfile } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import EditHostingPreference from "./EditHostingPreference";

const { t } = i18n;

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

const renderPage = () => {
  render(<EditHostingPreference />, { wrapper });
};

describe("EditHostingPreference", () => {
  beforeEach(() => {
    addDefaultUser(1);
    getUserMock.mockImplementation(getUser);
    updateHostingPreferenceMock.mockResolvedValue(new Empty());
  });

  it("should redirect to the user profile route with 'home' tab active after successful update", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    renderPage();

    const user = userEvent.setup();

    // Wait for the form to load
    await screen.findByText(
      t("profile:home_info_headings.hosting_preferences"),
    );

    // Make the form dirty by changing a field
    const maxGuestsInput = await screen.findByLabelText(
      t("profile:home_info_headings.max_guests"),
    );
    await user.clear(maxGuestsInput);
    await user.type(maxGuestsInput, "3");

    // Now the save button should be visible
    await user.click(
      await screen.findByRole("button", { name: t("global:save_changes") }),
    );
    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("home")),
    );
  });

  it(`should not submit the default headings for the '${t(
    "profile:home_info_headings.about_home",
  )}'section`, async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutPlace: "",
    }));
    renderPage();

    const user = userEvent.setup();

    // Wait for the form to load
    await screen.findByText(
      t("profile:home_info_headings.hosting_preferences"),
    );

    // Make the form dirty by changing a field
    const maxGuestsInput = await screen.findByLabelText(
      t("profile:home_info_headings.max_guests"),
    );
    await user.clear(maxGuestsInput);
    await user.type(maxGuestsInput, "3");

    // Now the save button should be visible
    await user.click(
      await screen.findByRole("button", { name: t("global:save_changes") }),
    );
    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("home")),
    );

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutPlace: "",
      }),
    );
  });

  it("should display the users hosting preferences", async () => {
    renderPage();

    await screen.findByText(
      t("profile:home_info_headings.hosting_preferences"),
    );

    expect(
      screen.getByLabelText(
        t("profile:edit_home_questions.accept_smoking"),
      ) as HTMLSelectElement,
    ).toHaveValue("1");

    expect(
      screen.getByLabelText(
        t("profile:home_info_headings.parking_details"),
      ) as HTMLSelectElement,
    ).toHaveValue("3");

    expect(
      screen.getByLabelText(
        t("profile:home_info_headings.space"),
      ) as HTMLSelectElement,
    ).toHaveValue("2");
  });
});
