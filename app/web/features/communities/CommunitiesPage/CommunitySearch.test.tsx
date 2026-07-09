import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CommunitySummary,
  NodeType,
  SearchCommunitiesRes,
} from "proto/communities_pb";
import { routeToCommunity } from "routes";
import * as communitiesService from "service/communities";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import CommunitySearch from "../CommunitiesPage/CommunitySearch";

const { t } = i18n;

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// AuthProvider pulls in @sentry/nextjs, which crashes under jsdom
jest.mock("platform/sentry", () => {
  const mockCaptureException = jest.fn();
  return {
    captureException: mockCaptureException,
    default: {
      captureException: mockCaptureException,
    },
  };
});

jest.mock("service/communities");
const mockSearchCommunities =
  communitiesService.searchCommunities as jest.MockedFunction<
    typeof communitiesService.searchCommunities
  >;

const parentedCommunity = (
  communityId: number,
  name: string,
  slug: string,
  regionName: string,
): CommunitySummary.AsObject => ({
  communityId,
  name,
  slug,
  parentsList: [
    {
      community: {
        communityId: communityId * 100,
        name: regionName,
        slug: regionName.toLowerCase(),
        description: `${regionName} region`,
      },
    },
    {
      community: {
        communityId,
        name,
        slug,
        description: `${name} community`,
      },
    },
  ],
  member: false,
  memberCount: 10,
  created: { seconds: 1577800000, nanos: 0 },
  nodeType: NodeType.NODE_TYPE_LOCALITY,
});

const mockCommunities: CommunitySummary.AsObject[] = [
  parentedCommunity(2, "Amsterdam", "amsterdam", "Europe"),
  parentedCommunity(3, "Rotterdam", "rotterdam", "Europe"),
  parentedCommunity(4, "Berlin", "berlin", "Europe"),
];

const searchRes = (
  communities: CommunitySummary.AsObject[],
): SearchCommunitiesRes.AsObject =>
  ({ resultsList: communities }) as SearchCommunitiesRes.AsObject;

describe("CommunitySearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchCommunities.mockResolvedValue(searchRes(mockCommunities));
  });

  it("renders the search input field", async () => {
    render(<CommunitySearch />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByLabelText(t("communities:search_communities")),
      ).toBeInTheDocument();
    });
  });

  it("shows placeholder text when input is empty", async () => {
    render(<CommunitySearch />, { wrapper });

    await waitFor(() => {
      const input = screen.getByLabelText(t("communities:search_communities"));
      expect(input).toHaveAttribute(
        "placeholder",
        t("communities:search_communities_placeholder"),
      );
    });
  });

  it("queries the backend with an empty query on mount (browse)", async () => {
    render(<CommunitySearch />, { wrapper });

    await waitFor(() => {
      expect(mockSearchCommunities).toHaveBeenCalledWith("");
    });
  });

  it("shows the communities the backend returns when opening the dropdown", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("Amsterdam")).toBeInTheDocument();
      expect(screen.getByText("Rotterdam")).toBeInTheDocument();
      expect(screen.getByText("Berlin")).toBeInTheDocument();
    });
  });

  it("queries the backend as the user types", async () => {
    mockSearchCommunities.mockResolvedValue(
      searchRes([
        parentedCommunity(2, "Amsterdam", "amsterdam", "Europe"),
        parentedCommunity(3, "Rotterdam", "rotterdam", "Europe"),
      ]),
    );

    render(<CommunitySearch />, { wrapper });
    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "dam");

    expect(await screen.findByText("Amsterdam")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSearchCommunities).toHaveBeenCalledWith("dam");
    });
  });

  it("renders results in the backend-provided order (issue #9129)", async () => {
    mockSearchCommunities.mockResolvedValue(
      searchRes([
        parentedCommunity(5, "Pyongyang", "pyongyang", "North Korea"),
        parentedCommunity(6, "Sydney", "sydney", "Australia"),
      ]),
    );

    render(<CommunitySearch />, { wrapper });
    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "yan");

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Pyongyang");
    expect(options[1]).toHaveTextContent("Sydney");
  });

  it("shows the region as context on each result", async () => {
    mockSearchCommunities.mockResolvedValue(
      searchRes([parentedCommunity(6, "Sydney", "sydney", "Australia")]),
    );

    render(<CommunitySearch />, { wrapper });
    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "syd");

    const option = await screen.findByRole("option");
    expect(within(option).getByText("Sydney")).toBeInTheDocument();
    expect(within(option).getByText("Australia")).toBeInTheDocument();
  });

  it("navigates to community page when an option is selected", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("Amsterdam")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Amsterdam"));

    expect(mockPush).toHaveBeenCalledWith(
      routeToCommunity(mockCommunities[0].communityId, mockCommunities[0].slug),
    );
  });

  it("shows no results message when the search returns empty", async () => {
    mockSearchCommunities.mockResolvedValue(searchRes([]));

    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "NonExistentCity");

    await waitFor(() => {
      expect(screen.getByText(/No communities found\./)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Request this community!" }),
      ).toBeInTheDocument();
    });
  });

  it("handles a failed search gracefully", async () => {
    mockSearchCommunities.mockRejectedValue(new Error("Search failed"));

    render(<CommunitySearch />, { wrapper });
    const user = userEvent.setup();

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "boom");

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Request this community!" }),
      ).toBeInTheDocument();
    });
  });
});
