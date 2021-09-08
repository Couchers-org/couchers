import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  APPLY_FILTER,
  CLEAR_SEARCH,
  FILTER_DIALOG_TITLE,
  OPEN_FILTER_DIALOG,
  SEARCH,
  USER_SEARCH,
} from "features/search/constants";
import useSearchFilters, {
  SearchFilters,
} from "features/search/useSearchFilters";
import { useEffect } from "react";
import wrapper, {
  getHookWrapperWithClient as complexWrapper,
} from "test/hookWrapper";

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
  it("performs a search with the enter key", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    const input = screen.getByLabelText(USER_SEARCH);
    userEvent.type(input, "test search{enter}");
    await waitFor(() => {
      expect(setActive).toBeCalledWith({ query: "test search" });
    });
  });

  it("performs a search with the button", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    const input = screen.getByLabelText(USER_SEARCH);
    userEvent.type(input, "test search");
    userEvent.click(screen.getByRole("button", { name: SEARCH }));
    await waitFor(() => {
      expect(setActive).toBeCalledWith({ query: "test search" });
    });
  });

  it("starts with a default value", async () => {
    render(<View />, {
      wrapper: complexWrapper({
        initialRouterEntries: ["?query=default+value"],
      }).wrapper,
    });
    const input = screen.getByLabelText(USER_SEARCH);
    expect(input).toHaveValue("default value");
  });

  it("clears correctly", async () => {
    render(<View />, {
      wrapper: complexWrapper({
        initialRouterEntries: ["?query=default+value"],
      }).wrapper,
    });
    const input = screen.getByLabelText(USER_SEARCH);
    expect(input).toHaveValue("default value");
    userEvent.click(screen.getByRole("button", { name: CLEAR_SEARCH }));
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("opens and closes the filter dialog", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    const input = screen.getByLabelText(USER_SEARCH);
    userEvent.type(input, "test search");
    userEvent.click(screen.getByRole("button", { name: OPEN_FILTER_DIALOG }));

    const dialog = screen.getByRole("dialog", { name: FILTER_DIALOG_TITLE });
    expect(dialog).toBeVisible();
    userEvent.click(screen.getByRole("button", { name: APPLY_FILTER }));
    await waitFor(() => {
      expect(dialog).not.toBeVisible();
    });

    expect(input).toHaveValue("test search");
    await waitFor(() => {
      expect(setActive).toBeCalledWith({ query: "test search" });
    });
  });
});
