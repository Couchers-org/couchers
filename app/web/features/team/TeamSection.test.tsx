import { render, screen } from "@testing-library/react";
import { Volunteer } from "couchers/proto/public_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import TeamSection from "./TeamSection";

const { t } = i18n;

const makeVolunteer = (
  name: string,
  isBoardMember: boolean,
): Volunteer.AsObject => ({
  name,
  username: name.toLowerCase().replace(" ", ""),
  isBoardMember,
  role: "Engineer",
  location: "Berlin",
  img: "",
  linkType: "",
  linkText: "",
  linkUrl: "",
});

const boardMember = makeVolunteer("Alice Board", true);
const regularMember = makeVolunteer("Bob Regular", false);

describe("TeamSection", () => {
  it("renders both board members and regular volunteers by default", () => {
    render(
      <TeamSection
        variant="current"
        volunteers={[boardMember, regularMember]}
      />,
      { wrapper },
    );
    expect(screen.getByText("Alice Board")).toBeInTheDocument();
    expect(screen.getByText("Bob Regular")).toBeInTheDocument();
  });

  it("shows only board members when boardMembersOnly is true", () => {
    render(
      <TeamSection
        variant="current"
        volunteers={[boardMember, regularMember]}
        boardMembersOnly
      />,
      { wrapper },
    );
    expect(screen.getByText("Alice Board")).toBeInTheDocument();
    expect(screen.queryByText("Bob Regular")).not.toBeInTheDocument();
  });

  it("renders the extra card when hasExtraCard and extraCardContent are provided", () => {
    render(
      <TeamSection
        variant="current"
        volunteers={[boardMember]}
        hasExtraCard
        extraCardContent={{
          text: "Join our team",
          link: "More about the team",
        }}
      />,
      { wrapper },
    );
    expect(screen.getByText("Join our team")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "More about the team" }),
    ).toBeInTheDocument();
  });

  it("does not render the extra card when hasExtraCard is false", () => {
    render(
      <TeamSection
        variant="current"
        volunteers={[boardMember]}
        hasExtraCard={false}
        extraCardContent={{
          text: "Join our team",
          link: "More about the team",
        }}
      />,
      { wrapper },
    );
    expect(screen.queryByText("Join our team")).not.toBeInTheDocument();
  });

  it("renders nothing when volunteers list is empty", () => {
    const { container } = render(
      <TeamSection variant="current" volunteers={[]} />,
      { wrapper },
    );
    expect(container.querySelector(".MuiCard-root")).not.toBeInTheDocument();
  });

  it("shows the board member badge for board members", () => {
    render(<TeamSection variant="current" volunteers={[boardMember]} />, {
      wrapper,
    });
    expect(screen.getByText(t("global:team.board_member"))).toBeInTheDocument();
  });

  it("renders all past volunteers exactly once, without duplicating board members", () => {
    render(
      <TeamSection variant="past" volunteers={[boardMember, regularMember]} />,
      { wrapper },
    );
    // A past volunteer who still holds the board-member badge must not be
    // rendered twice (regression: past used to render board + full lists).
    expect(screen.getAllByText("Alice Board")).toHaveLength(1);
    expect(screen.getAllByText("Bob Regular")).toHaveLength(1);
  });
});
