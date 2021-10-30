import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  APPLY_FILTER,
  CLEAR_SEARCH,
  FILTER_DIALOG_TITLE,
  LOCATION,
  PROFILE_KEYWORDS,
  SEARCH_BY_KEYWORD,
  SEARCH_BY_LOCATION,
} from "features/search/constants";
import useSearchFilters, {
  SearchFilters,
} from "features/search/useSearchFilters";
import { useEffect } from "react";
import wrapper, {
  getHookWrapperWithClient as complexWrapper,
} from "test/hookWrapper";
import { server } from "test/restMock";

import SearchBox from "./SearchBox";

const View = ({
  setActive,
}: {
  setActive?: (value: SearchFilters) => void;
}) => {
  const filters = useSearchFilters("");
  useEffect(() => {
    setActive?.(filters.active);
  }, [filters.active, setActive]);
  return <SearchBox searchFilters={filters} />;
};

describe("SearchBox", () => {
  it("performs a keyword search", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    userEvent.click(screen.getByLabelText(SEARCH_BY_KEYWORD));
    const input = screen.getByLabelText(PROFILE_KEYWORDS);
    userEvent.type(input, "test search");
    await waitFor(() => {
      expect(setActive).toBeCalledWith({ query: "test search" });
    });
  });

  describe("with mocked location search", () => {
    beforeEach(() => {
      server.listen();
    });
    afterEach(() => {
      server.close();
    });
    it("performs a location search", async () => {
      const setActive = jest.fn();
      render(<View setActive={setActive} />, { wrapper });
      const input = screen.getByLabelText(LOCATION);
      userEvent.type(input, "tes{enter}");
      userEvent.click(await screen.findByText("test city, test country"));
      await waitFor(() => {
        expect(setActive).toBeCalledWith({
          location: "test city, test country",
          lng: 1.0,
          lat: 2.0,
        });
      });
    });
  });

  it("shows default keyword field with a default value from url", async () => {
    render(<View />, {
      wrapper: complexWrapper({
        initialRouterEntries: ["?query=default+value"],
      }).wrapper,
    });
    expect(screen.getByLabelText(SEARCH_BY_KEYWORD)).toBeChecked();
    const input = screen.getByLabelText(PROFILE_KEYWORDS);
    expect(input).toHaveValue("default value");
  });

  it("shows default location field with a default value from url", async () => {
    render(<View />, {
      wrapper: complexWrapper({
        initialRouterEntries: ["?location=default+value&lat=2&lng=2"],
      }).wrapper,
    });
    //not easy to also test lat/lng, just test location text
    expect(screen.getByLabelText(SEARCH_BY_LOCATION)).toBeChecked();
    const input = screen.getByLabelText(LOCATION);
    expect(input).toHaveValue("default value");
  });

  it("clears keyword search correctly", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, {
      wrapper: complexWrapper({
        initialRouterEntries: ["?query=default+value"],
      }).wrapper,
    });
    const input = screen.getByLabelText(PROFILE_KEYWORDS);
    expect(input).toHaveValue("default value");
    userEvent.click(screen.getByRole("button", { name: CLEAR_SEARCH }));
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(setActive).toBeCalledWith({});
    });
  });

  it("clears location search and all other filters correctly", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, {
      wrapper: complexWrapper({
        initialRouterEntries: [
          "?location=default+location&lat=2&lng=2&lastActive=7",
        ],
      }).wrapper,
    });
    const input = screen.getByLabelText(LOCATION);
    expect(input).toHaveValue("default location");
    userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(setActive).toBeCalledWith({});
    });
  });

  it("opens and closes the filter dialog, with changes applied to search box", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    userEvent.click(screen.getByLabelText(SEARCH_BY_KEYWORD));
    const input = screen.getByLabelText(PROFILE_KEYWORDS);
    userEvent.type(input, "test search");
    await waitFor(() => {
      expect(setActive).toBeCalledWith({ query: "test search" });
    });
    userEvent.click(screen.getByRole("button", { name: FILTER_DIALOG_TITLE }));

    const dialog = screen.getByRole("dialog", { name: FILTER_DIALOG_TITLE });
    expect(dialog).toBeVisible();
    const dialogKeywordsField = within(dialog).getByLabelText(PROFILE_KEYWORDS);
    expect(dialogKeywordsField).toHaveValue("test search");
    userEvent.clear(dialogKeywordsField);
    userEvent.type(dialogKeywordsField, "new search");
    userEvent.click(screen.getByRole("button", { name: APPLY_FILTER }));
    await waitFor(
      () => {
        expect(dialog).not.toBeVisible();
      },
      { timeout: 5000 }
    );

    expect(input).toHaveValue("new search");
  });
});
