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

// mock required: the wrapper pulls in @sentry/nextjs via AuthProvider, which crashes under jsdom.
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
const mockListAllCommunities =
  communitiesService.listAllCommunities as jest.MockedFunction<
    typeof communitiesService.listAllCommunities
  >;
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
  ({ communitiesList: communities }) as SearchCommunitiesRes.AsObject;

describe("CommunitySearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListAllCommunities.mockResolvedValue({
      communitiesList: mockCommunities,
    });
    mockSearchCommunities.mockResolvedValue(searchRes([]));
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

  it("fetches all communities on mount for the browse state", async () => {
    render(<CommunitySearch />, { wrapper });

    await waitFor(() => {
      expect(mockListAllCommunities).toHaveBeenCalledTimes(1);
    });
  });

  it("displays all communities grouped by region when opening dropdown", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockListAllCommunities).toHaveBeenCalled();
    });

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("Amsterdam")).toBeInTheDocument();
      expect(screen.getByText("Rotterdam")).toBeInTheDocument();
      expect(screen.getByText("Berlin")).toBeInTheDocument();
      expect(screen.getByText("Europe")).toBeInTheDocument();
    });
  });

  it("filters the browse list client-side for short queries (< 3 chars)", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockListAllCommunities).toHaveBeenCalled();
    });

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "da");

    await waitFor(() => {
      expect(screen.queryByText("Berlin")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Amsterdam")).toBeInTheDocument();
    expect(screen.getByText("Rotterdam")).toBeInTheDocument();
    expect(mockSearchCommunities).not.toHaveBeenCalled();
  });

  it("uses the server-side ranked search for queries >= 3 chars", async () => {
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
    expect(screen.getByText("Rotterdam")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSearchCommunities).toHaveBeenCalledWith("dam");
    });
  });

  it("renders server results in the returned order, not the hidden hierarchy path (issue #9129)", async () => {
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

  it("shows the region as context on each search result", async () => {
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

    await waitFor(() => {
      expect(mockListAllCommunities).toHaveBeenCalled();
    });

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
