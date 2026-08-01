import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Community, NodeType } from "couchers/proto/communities_pb";
import { routeToCommunity } from "routes";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import SubCommunitiesDropdown from "./SubCommunitiesDropdown";

const { t } = i18n;

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("platform/sentry", () => {
  const mockCaptureException = jest.fn();
  return {
    captureException: mockCaptureException,
    default: {
      captureException: mockCaptureException,
    },
  };
});

const mockChildCommunity = (
  overrides: Partial<Community.AsObject>,
): Community.AsObject => ({
  communityId: 100,
  name: "Amsterdam",
  slug: "amsterdam",
  description: "",
  parentsList: [],
  member: false,
  admin: false,
  memberCount: 1,
  adminCount: 1,
  nearbyUserCount: 0,
  canModerate: false,
  smallCommunityFeaturesEnabled: false,
  nodeType: NodeType.NODE_TYPE_LOCALITY,
  ...overrides,
});

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    await screen.findByRole("button", {
      name: t("communities:sub_community_dropdown_a11y"),
    }),
  );
};

describe("SubCommunitiesDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("labels the trigger button for the children's node type", async () => {
    render(
      <SubCommunitiesDropdown subCommunities={[mockChildCommunity({})]} />,
      {
        wrapper,
      },
    );

    expect(
      await screen.findByRole("button", {
        name: t("communities:sub_community_dropdown_a11y"),
      }),
    ).toHaveTextContent(t("communities:select_locality"));
  });

  it("filters the menu as the user types without losing keystrokes to the menu", async () => {
    const user = userEvent.setup();
    render(
      <SubCommunitiesDropdown
        subCommunities={[
          mockChildCommunity({ communityId: 100, name: "Amsterdam" }),
          mockChildCommunity({
            communityId: 101,
            name: "Berlin",
            slug: "berlin",
          }),
        ]}
      />,
      { wrapper },
    );

    await openMenu(user);

    expect(await screen.findByRole("menuitem", { name: "Amsterdam" }));
    expect(screen.getByRole("menuitem", { name: "Berlin" }));

    const searchInput = screen.getByPlaceholderText(
      t("communities:sub_community_search_placeholder"),
    );
    await user.type(searchInput, "ams");

    expect(searchInput).toHaveValue("ams");
    expect(screen.getByRole("menuitem", { name: "Amsterdam" }));
    expect(
      screen.queryByRole("menuitem", { name: "Berlin" }),
    ).not.toBeInTheDocument();
  });

  it("closes the menu when Escape is pressed from the search input", async () => {
    const user = userEvent.setup();
    render(
      <SubCommunitiesDropdown subCommunities={[mockChildCommunity({})]} />,
      {
        wrapper,
      },
    );

    await openMenu(user);

    const searchInput = screen.getByPlaceholderText(
      t("communities:sub_community_search_placeholder"),
    );
    searchInput.focus();
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByRole("menuitem", { name: "Amsterdam" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("navigates to the selected child community", async () => {
    const amsterdam = mockChildCommunity({
      communityId: 100,
      name: "Amsterdam",
      slug: "amsterdam",
    });
    const user = userEvent.setup();
    render(
      <SubCommunitiesDropdown
        subCommunities={[
          amsterdam,
          mockChildCommunity({
            communityId: 101,
            name: "Berlin",
            slug: "berlin",
          }),
        ]}
      />,
      { wrapper },
    );

    await openMenu(user);

    await user.click(
      await screen.findByRole("menuitem", { name: "Amsterdam" }),
    );

    expect(mockPush).toHaveBeenCalledWith(
      routeToCommunity(amsterdam.communityId, amsterdam.slug),
    );
  });

  it("shows a request-community link when the search has no matches", async () => {
    const user = userEvent.setup();
    render(
      <SubCommunitiesDropdown subCommunities={[mockChildCommunity({})]} />,
      {
        wrapper,
      },
    );

    await openMenu(user);

    await user.type(
      screen.getByPlaceholderText(
        t("communities:sub_community_search_placeholder"),
      ),
      "NonExistentCity",
    );

    expect(
      await screen.findByRole("link", { name: "Request this community!" }),
    ).toBeInTheDocument();
  });
});
