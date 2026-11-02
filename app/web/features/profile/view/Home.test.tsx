import { render, screen } from "@testing-library/react";
import { HostingStatus, SleepingArrangement, SmokingLocation, User } from "proto/api_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser } from "test/utils";
import { firstName } from "utils/names";

import Home, { HomePreview } from "./Home";

const { t } = i18n;

const unansweredUser: User.AsObject = {
  ...defaultUser,
  sleepingArrangement: SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
  smokingAllowed: SmokingLocation.SMOKING_LOCATION_UNKNOWN,
  maxGuests: undefined,
  lastMinute: undefined,
  acceptsKids: undefined,
  acceptsPets: undefined,
  drinkingAllowed: undefined,
  campingOk: undefined,
  wheelchairAccessible: undefined,
  hasHousemates: undefined,
  hasKids: undefined,
  hasPets: undefined,
  drinksAtHome: undefined,
  smokesAtHome: undefined,
  parking: undefined,
};

function renderHome(user: Partial<User.AsObject>) {
  return render(<Home user={{ ...unansweredUser, ...user }} />, { wrapper });
}

describe("Home", () => {
  it("answers each question with its yes or no wording, or ask me", () => {
    renderHome({
      sleepingArrangement: SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON,
      parking: { value: false },
      acceptsKids: { value: true },
      smokingAllowed: SmokingLocation.SMOKING_LOCATION_OUTSIDE,
    });

    // several-answer questions show the answer under their label
    expect(screen.getByText(t("profile:home_info_headings.space")).nextElementSibling).toHaveTextContent(
      t("profile:sleeping_arrangement.common_short"),
    );
    expect(screen.getByText(t("profile:edit_home_questions.accept_smoking")).nextElementSibling).toHaveTextContent(
      t("profile:smoking_location.outside"),
    );
    // yes/no questions read as a statement
    expect(screen.getByText(t("profile:edit_home_questions.accept_kids"))).toBeVisible();
    expect(screen.getByText(t("profile:home_facts.parking_no_text"))).toBeVisible();
    // unanswered questions show the question with "Ask me"
    expect(screen.getByText(t("profile:home_info_headings.last_minute")).nextElementSibling).toHaveTextContent(
      t("profile:info_unanswered"),
    );
  });
});

describe("HomePreview", () => {
  const hostingUser = {
    ...unansweredUser,
    hostingStatus: HostingStatus.HOSTING_STATUS_CAN_HOST,
    maxGuests: { value: 2 },
    sleepingArrangement: SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE,
    lastMinute: { value: true },
  };

  it("links to editing the home section only on your own profile", () => {
    addDefaultUser();
    const { unmount } = render(<HomePreview user={hostingUser} />, { wrapper });
    expect(
      screen.getByRole("link", {
        name: t("profile:edit_section_button_a11y", {
          section_name: t("profile:home_preview.heading", { first_name: firstName(defaultUser.name) }),
        }),
      }),
    ).toHaveAttribute("href", "/profile/edit/home#hosting-preferences");
    unmount();

    addDefaultUser(defaultUser.userId + 1);
    render(<HomePreview user={hostingUser} />, { wrapper });
    expect(
      screen.queryByRole("link", {
        name: t("profile:edit_section_button_a11y", {
          section_name: t("profile:home_preview.heading", { first_name: firstName(defaultUser.name) }),
        }),
      }),
    ).not.toBeInTheDocument();
  });

  it("leaves out the last-minute card when last-minute requests aren't accepted", () => {
    render(<HomePreview user={{ ...hostingUser, lastMinute: { value: false } }} />, { wrapper });

    expect(screen.getByText(t("profile:home_info_headings.max_guests"))).toBeVisible();
    expect(screen.queryByText(t("profile:home_info_headings.last_minute"))).not.toBeInTheDocument();
  });

  it("shows nothing when none of the hosting basics are filled in", () => {
    const { container } = render(
      <HomePreview
        user={{
          ...hostingUser,
          maxGuests: undefined,
          sleepingArrangement: SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
          lastMinute: undefined,
        }}
      />,
      { wrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing for people who can't host", () => {
    const { container } = render(
      <HomePreview user={{ ...hostingUser, hostingStatus: HostingStatus.HOSTING_STATUS_CANT_HOST }} />,
      { wrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });
});
