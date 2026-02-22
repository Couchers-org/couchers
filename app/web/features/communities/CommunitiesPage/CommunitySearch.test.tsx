import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sentry from "platform/sentry";
import { CommunitySummary, NodeType } from "proto/communities_pb";
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

const mockCommunities: CommunitySummary.AsObject[] = [
  {
    communityId: 2,
    name: "Amsterdam",
    slug: "amsterdam",
    parentsList: [
      {
        community: {
          communityId: 1,
          name: "Europe",
          slug: "europe",
          description: "European region",
        },
      },
    ],
    member: false,
    memberCount: 10,
    created: { seconds: 1577800000, nanos: 0 },
    nodeType: NodeType.NODE_TYPE_LOCALITY,
  },
  {
    communityId: 3,
    name: "Rotterdam",
    slug: "rotterdam",
    parentsList: [
      {
        community: {
          communityId: 1,
          name: "Europe",
          slug: "europe",
          description: "European region",
        },
      },
    ],
    member: false,
    memberCount: 8,
    created: { seconds: 1577900000, nanos: 0 },
    nodeType: NodeType.NODE_TYPE_LOCALITY,
  },
  {
    communityId: 4,
    name: "Berlin",
    slug: "berlin",
    parentsList: [
      {
        community: {
          communityId: 1,
          name: "Europe",
          slug: "europe",
          description: "European region",
        },
      },
    ],
    member: false,
    memberCount: 15,
    created: { seconds: 1578000000, nanos: 0 },
    nodeType: NodeType.NODE_TYPE_LOCALITY,
  },
];

describe("CommunitySearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListAllCommunities.mockResolvedValue({
      communitiesList: mockCommunities,
    });
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

  it("fetches all communities on mount", async () => {
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

  it("filters communities when typing", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockListAllCommunities).toHaveBeenCalled();
    });

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "dam");

    await waitFor(() => {
      expect(screen.getByText("Amsterdam")).toBeInTheDocument();
      expect(screen.getByText("Rotterdam")).toBeInTheDocument();
    });

    // Berlin should be filtered out
    expect(screen.queryByText("Berlin")).not.toBeInTheDocument();
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

  it("shows no results message when filter returns empty", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockListAllCommunities).toHaveBeenCalled();
    });

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "NonExistentCity");

    await waitFor(() => {
      // Check for the no results text
      expect(screen.getByText(/No communities found\./)).toBeInTheDocument();

      // Check that there's a link to request the community
      expect(
        screen.getByRole("link", { name: "Request this community!" }),
      ).toBeInTheDocument();
    });
  });

  it("handles fetch errors gracefully", async () => {
    const captureExceptionSpy = jest.spyOn(Sentry, "captureException");
    mockListAllCommunities.mockRejectedValue(new Error("Fetch failed"));

    render(<CommunitySearch />, { wrapper });

    await waitFor(() => {
      expect(captureExceptionSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            component: "CommunitySearch",
            action: "fetchAllCommunities",
          }),
        }),
      );
    });

    captureExceptionSpy.mockRestore();
  });
});
