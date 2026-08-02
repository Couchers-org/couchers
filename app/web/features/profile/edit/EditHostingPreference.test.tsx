import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getUser } from "test/serviceMockDefaults";

import { ParkingDetails } from "../../../proto/api_pb";
import { addDefaultUser, MockedService } from "../../../test/utils";
import EditHostingPreference from "./EditHostingPreference";

const { t } = i18n;

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<typeof service.user.getUser>;
const updateHostingPreferenceMock = service.user.updateHostingPreference as MockedService<
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

  it("should show success toast after successful update", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    renderPage();

    const user = userEvent.setup();

    // Wait for the form to load
    await screen.findByText(t("profile:home_info_headings.hosting_preferences"));

    // Make the form dirty by changing a field
    const maxGuestsInput = await screen.findByLabelText(t("profile:home_info_headings.max_guests"));
    await user.clear(maxGuestsInput);
    await user.type(maxGuestsInput, "3");

    // Now the save button should be visible
    await user.click(await screen.findByRole("button", { name: t("global:save_changes") }));
    await waitFor(() => expect(screen.getByText(t("profile:hosting_preferences_success_message"))).toBeInTheDocument());
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
    await screen.findByText(t("profile:home_info_headings.hosting_preferences"));

    // Make the form dirty by changing a field
    const maxGuestsInput = await screen.findByLabelText(t("profile:home_info_headings.max_guests"));
    await user.clear(maxGuestsInput);
    await user.type(maxGuestsInput, "3");

    // Now the save button should be visible
    await user.click(await screen.findByRole("button", { name: t("global:save_changes") }));

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutPlace: "",
      }),
    );
  });

  it("should pre-fill info based on existing user values", async () => {
    renderPage();

    await screen.findByText(t("profile:home_info_headings.hosting_preferences"));

    const lastMinuteField = screen.getByLabelText(t("profile:home_info_headings.last_minute")) as HTMLInputElement;
    expect(lastMinuteField).toBeChecked();

    // Check that free text input fields are pre-filled with existing values
    const aboutPlaceField = await screen.findByLabelText(t("profile:home_info_headings.about_home"));
    expect(aboutPlaceField).toHaveValue("You should not come if you are allergic to cat furs.");

    const hasKidsField = await screen.findByLabelText(t("profile:home_info_headings.has_kids"));
    expect(hasKidsField).toBeChecked();

    const acceptKidsField = await screen.findByLabelText(t("profile:edit_home_questions.accept_kids"));
    expect(acceptKidsField).toBeChecked();

    const hasHousematesField = await screen.findByLabelText(t("profile:home_info_headings.has_housemates"));
    expect(hasHousematesField).toBeChecked();

    const acceptPetsField = await screen.findByLabelText(t("profile:edit_home_questions.accept_pets"));

    expect(acceptPetsField).toBeChecked();

    const areaField = await screen.findByLabelText(t("profile:home_info_headings.local_area"));
    expect(areaField).toHaveValue("Great neighborhood with cafes and parks nearby");

    const sleepingDetailsField = await screen.findByLabelText(t("profile:home_info_headings.sleeping_arrangement"));
    expect(sleepingDetailsField).toHaveValue("Comfortable sofa bed in living room");

    const houseRulesField = await screen.findByLabelText(t("profile:home_info_headings.house_rules"));
    expect(houseRulesField).toHaveValue("No smoking inside, quiet hours after 10pm");

    const otherHostInfoField = await screen.findByLabelText(t("profile:home_info_headings.other_info"));
    expect(otherHostInfoField).toHaveValue("I have a friendly cat and love cooking together");

    // Check conditional fields that should appear when checkboxes are checked
    const housemateDetailsField = await screen.findByLabelText(t("profile:home_info_headings.housemate_details"));
    expect(housemateDetailsField).toHaveValue("Two roommates, both graduate students");

    const kidDetailsField = await screen.findByLabelText(t("profile:home_info_headings.kid_details"));
    expect(kidDetailsField).toHaveValue("One 8-year-old daughter, very friendly");

    const petDetailsField = await screen.findByLabelText(t("profile:home_info_headings.pet_details"));
    expect(petDetailsField).toHaveValue("One cat named Mittens, very social");
  });

  it("should display the users hosting preferences", async () => {
    renderPage();

    await screen.findByText(t("profile:home_info_headings.hosting_preferences"));

    expect(screen.getByLabelText(t("profile:edit_home_questions.accept_smoking")) as HTMLSelectElement).toHaveValue(
      "1",
    );

    expect(screen.getByLabelText(t("profile:home_info_headings.parking_details")) as HTMLSelectElement).toHaveValue(
      "3",
    );

    expect(screen.getByLabelText(t("profile:home_info_headings.space")) as HTMLSelectElement).toHaveValue("2");
  });

  it("should properly update a value when the user unchecks the checkbox", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    renderPage();

    const user = userEvent.setup();

    const lastMinuteCheckbox = await screen.findByLabelText(t("profile:home_info_headings.last_minute"));

    expect(lastMinuteCheckbox).toBeChecked();

    await user.click(lastMinuteCheckbox);

    expect(lastMinuteCheckbox).not.toBeChecked();

    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });
    await user.click(saveButton);

    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lastMinute: false,
      }),
    );
  });

  it("should clear related input value when the user unchecks the checkbox", async () => {
    // prevent the unsavedChanged pop up by mocking window.confirm
    jest.spyOn(window, "confirm").mockImplementation(() => true);

    renderPage();

    const user = userEvent.setup();

    const hasHousematesCheckbox = await screen.findByLabelText(t("profile:home_info_headings.has_housemates"));

    const hasHousematesDetailsField = (await screen.findByLabelText(
      t("profile:home_info_headings.housemate_details"),
    )) as HTMLInputElement;

    expect(hasHousematesCheckbox).toBeChecked();

    expect(hasHousematesDetailsField).toHaveValue("Two roommates, both graduate students");

    await user.click(hasHousematesCheckbox);

    expect(hasHousematesCheckbox).not.toBeChecked();

    const hasChildrenCheckbox = await screen.findByLabelText(t("profile:home_info_headings.has_kids"));

    const hasChildrenDetailsField = (await screen.findByLabelText(
      t("profile:home_info_headings.kid_details"),
    )) as HTMLInputElement;

    expect(hasChildrenCheckbox).toBeChecked();

    expect(hasChildrenDetailsField).toHaveValue("One 8-year-old daughter, very friendly");

    await user.click(hasChildrenCheckbox);

    expect(hasChildrenCheckbox).not.toBeChecked();

    const hasPetsCheckbox = await screen.findByLabelText(t("profile:home_info_headings.has_pets"));

    const hasPetsDetailsField = (await screen.findByLabelText(
      t("profile:home_info_headings.pet_details"),
    )) as HTMLInputElement;

    expect(hasPetsCheckbox).toBeChecked();

    expect(hasPetsDetailsField).toHaveValue("One cat named Mittens, very social");

    await user.click(hasPetsCheckbox);

    expect(hasPetsCheckbox).not.toBeChecked();

    const hasParkingAvailableCheckbox = await screen.findByLabelText(t("profile:home_info_headings.parking"));

    const hasParkingAvailableDetailsField = (await screen.findByLabelText(
      t("profile:home_info_headings.parking_details"),
    )) as HTMLSelectElement;

    expect(hasParkingAvailableCheckbox).toBeChecked();

    expect(hasParkingAvailableDetailsField).toHaveValue("3");

    await user.click(hasParkingAvailableCheckbox);

    expect(hasParkingAvailableCheckbox).not.toBeChecked();

    const saveButton = await screen.findByRole("button", {
      name: t("global:save_changes"),
    });

    await user.click(saveButton);

    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasHousemates: false,
        housemateDetails: "",
        hasKids: false,
        kidDetails: "",
        hasPets: false,
        petDetails: "",
        parking: false,
        parkingDetails: ParkingDetails.PARKING_DETAILS_UNKNOWN,
      }),
    );
  });
});
