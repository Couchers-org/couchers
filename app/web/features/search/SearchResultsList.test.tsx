import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchResultsList from "./SearchResultsList";
import users from "test/fixtures/users.json";
import { firstName } from "utils/names";
import wrapper from "test/hookWrapper";
import { service } from "service";
import {
  assertErrorAlert,
  MockedService,
  t,
} from "test/utils";

const mockHandleResultClick = jest.fn();

jest.mock("maplibre-gl");

const getLanguagesMock = service.resources.getLanguages as MockedService<
  typeof service.resources.getLanguages
>;

function testResults() {
  return {
    pageParams: [],
    pages: [
      {
        nextPageToken: "",
        resultsList: {
          community: undefined,
          event: undefined,
          snippet: "",
          group: undefined,
          guide: undefined,
          place: undefined,
          rank: 1,
          user: users[0],
        }
      }
    ]
  };
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
          error={undefined}
          hasNext={undefined}
          fetchNextPage={() => {}}
          selectedResult={undefined}
          setSelectedResult={mockHandleResultClick}

          searchType={""}
          setSearchType={() => {}}
          locationResult={""}
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
          results={testResults() as any}
          error={"error message"}
          hasNext={undefined}
          fetchNextPage={() => {}}
          selectedResult={undefined}
          setSelectedResult={mockHandleResultClick}

          searchType={""}
          setSearchType={() => {}}
          locationResult={""}
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
