import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sentry from "platform/sentry";
import { Community } from "proto/communities_pb";
import { routeToCommunity } from "routes";
import * as communitiesService from "service/communities";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import CommunitySearch from "./CommunitySearch";

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
const mockListCommunities =
  communitiesService.listCommunities as jest.MockedFunction<
    typeof communitiesService.listCommunities
  >;

const mockRegion: Community.AsObject = {
  communityId: 1,
  name: "Europe",
  slug: "europe",
  description: "European region",
  parentsList: [],
  member: false,
  admin: false,
  memberCount: 0,
  adminCount: 0,
  nearbyUserCount: 0,
  canModerate: false,
  discussionsEnabled: true,
  eventsEnabled: true,
  created: { seconds: 1577800000, nanos: 0 },
  mainPage: undefined,
};

const mockCities: Community.AsObject[] = [
  {
    communityId: 2,
    name: "Amsterdam",
    slug: "amsterdam",
    description: "Amsterdam city",
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
    admin: false,
    memberCount: 10,
    adminCount: 2,
    nearbyUserCount: 5,
    canModerate: false,
    discussionsEnabled: true,
    eventsEnabled: true,
    created: { seconds: 1577800000, nanos: 0 },
    mainPage: undefined,
  },
  {
    communityId: 3,
    name: "Rotterdam",
    slug: "rotterdam",
    description: "Rotterdam city",
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
    admin: false,
    memberCount: 8,
    adminCount: 1,
    nearbyUserCount: 4,
    canModerate: false,
    discussionsEnabled: true,
    eventsEnabled: true,
    created: { seconds: 1577900000, nanos: 0 },
    mainPage: undefined,
  },
  {
    communityId: 4,
    name: "Berlin",
    slug: "berlin",
    description: "Berlin city",
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
    admin: false,
    memberCount: 15,
    adminCount: 3,
    nearbyUserCount: 7,
    canModerate: false,
    discussionsEnabled: true,
    eventsEnabled: true,
    created: { seconds: 1578000000, nanos: 0 },
    mainPage: undefined,
  },
];

describe("CommunitySearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetching regions (communityId = 0)
    mockListCommunities.mockImplementation(async (communityId) => {
      if (communityId === 0) {
        return {
          communitiesList: [mockRegion],
          nextPageToken: "",
        };
      }
      // Mock fetching subcommunities of a region
      return {
        communitiesList: mockCities,
        nextPageToken: "",
      };
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
      // Should fetch regions first (communityId = 0)
      expect(mockListCommunities).toHaveBeenCalledWith(0);
      // Then fetch subcommunities for each region
      expect(mockListCommunities).toHaveBeenCalledWith(mockRegion.communityId);
    });
  });

  it("displays all communities grouped by region when opening dropdown", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockListCommunities).toHaveBeenCalled();
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
      expect(mockListCommunities).toHaveBeenCalled();
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
      expect(mockListCommunities).toHaveBeenCalled();
    });

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("Amsterdam")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Amsterdam"));

    expect(mockPush).toHaveBeenCalledWith(
      routeToCommunity(mockCities[0].communityId, mockCities[0].slug),
    );
  });

  it("shows no results message when filter returns empty", async () => {
    render(<CommunitySearch />, { wrapper });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockListCommunities).toHaveBeenCalled();
    });

    const input = screen.getByLabelText(t("communities:search_communities"));
    await user.type(input, "NonExistentCity");

    await waitFor(() => {
      expect(
        screen.getByText(t("communities:no_results_found")),
      ).toBeInTheDocument();
    });
  });

  it("handles fetch errors gracefully", async () => {
    const captureExceptionSpy = jest.spyOn(Sentry, "captureException");
    mockListCommunities.mockRejectedValue(new Error("Fetch failed"));

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
