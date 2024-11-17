import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LngLat } from "maplibre-gl";
import { UserSearchRes } from "proto/search_pb";
import { InfiniteData } from "react-query";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, MockedService, t } from "test/utils";
import { firstName } from "utils/names";

import SearchResultsList from "./SearchResultsList";

const mockHandleResultClick = jest.fn();

jest.mock("maplibre-gl");

const getLanguagesMock = service.resources.getLanguages as MockedService<
  typeof service.resources.getLanguages
>;

function mockTestResults() {
  const mockResults: InfiniteData<UserSearchRes.AsObject> | undefined = {
    pageParams: [],
    pages: [
      {
        nextPageToken: "token123",
        resultsList: [
          {
            community: undefined,
            event: undefined,
            snippet: "Sample snippet",
            group: undefined,
            guide: undefined,
            place: undefined,
            rank: 1,
            user: users[0],
          },
        ],
      },
    ],
  };
  return mockResults;
}

describe("SearchResultsList", () => {
  beforeEach(() => {
    getLanguagesMock.mockResolvedValue({
      languagesList: [{ code: "en", name: "English" }],
    });
  });

  describe("after searching, no results", () => {
    beforeEach(() => {
      render(
        <SearchResultsList
          isLoading={false}
          results={undefined}
          selectedResult={undefined}
          setSelectedResult={mockHandleResultClick}
          setSearchType={() => {}}
          searchType="location"
          locationResult={{
            name: "Oakland",
            simplifiedName: "Oakland",
            location: new LngLat(0, 0),
            bbox: [0, 0, 0, 0],
          }}
          setLocationResult={() => {}}
          setQueryName={() => {}}
          queryName={"test query"}
        />,
        { wrapper }
      );
    });

    it("show message no result was found", async () => {
      await screen.findByText("No users found.");
      expect(screen.queryAllByRole("heading")).toHaveLength(0);
    });
  });

  describe("after searching, one result", () => {
    beforeEach(() => {
      render(
        <SearchResultsList
          isLoading={false}
          results={mockTestResults()}
          error={"error message"}
          hasNext={undefined}
          selectedResult={undefined}
          setSelectedResult={mockHandleResultClick}
          searchType={"location"}
          setSearchType={() => {}}
          locationResult={{
            name: "Oakland",
            simplifiedName: "Oakland",
            location: new LngLat(0, 0),
            bbox: [0, 0, 0, 0],
          }}
          setLocationResult={() => {}}
          setQueryName={() => {}}
          queryName={"test query"}
        />,
        { wrapper }
      );
    });

    it("displays the result", async () => {
      await screen.findByRole("heading", { name: users[0].name });
    });

    it("calls the handler when a result is clicked", async () => {
      const card = await screen.findByRole("button", {
        name: t("search:search_result.show_user_button_label", {
          name: firstName(users[0].name),
        }),
      });

      userEvent.click(card);

      await waitFor(() => {
        expect(mockHandleResultClick).toBeCalledTimes(1);
      });
    });

    it("displays an error when its received by props", async () => {
      await assertErrorAlert("error message");
    });
  });
});
