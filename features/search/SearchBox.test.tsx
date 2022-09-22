import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import mockRouter from "next-router-mock";
import { useEffect } from "react";
import wrapper from "test/hookWrapper";
import { server } from "test/restMock";
import { t } from "test/utils";
import SearchFilters from "utils/searchFilters";

import SearchBox from "./SearchBox";

const View = ({
  setActive,
}: {
  setActive?: (value: SearchFilters) => void;
}) => {
  const filters = useRouteWithSearchFilters("");
  useEffect(() => {
    setActive?.(filters.active);
  }, [filters.active, setActive]);
  return <SearchBox searchFilters={filters} />;
};

describe("SearchBox", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("");
  });

  it("performs a keyword search", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    userEvent.click(
      screen.getByLabelText(t("search:form.by_keyword_filter_label"))
    );
    const input = screen.getByLabelText(t("search:form.keywords.field_label"));
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
      const input = screen.getByLabelText(
        t("search:form.location_field_label")
      );
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
    mockRouter.setCurrentUrl("?query=default+value");
    render(<View />, {
      wrapper,
    });
    expect(
      screen.getByLabelText(t("search:form.by_keyword_filter_label"))
    ).toBeChecked();
    const input = screen.getByLabelText(t("search:form.keywords.field_label"));
    expect(input).toHaveValue("default value");
  });

  it("shows default location field with a default value from url", async () => {
    mockRouter.setCurrentUrl("?location=default+value&lat=2&lng=2");
    render(<View />, {
      wrapper,
    });
    //not easy to also test lat/lng, just test location text
    expect(
      screen.getByLabelText(t("search:form.by_location_filter_label"))
    ).toBeChecked();
    const input = screen.getByLabelText(t("search:form.location_field_label"));
    expect(input).toHaveValue("default value");
  });

  it("clears keyword search correctly", async () => {
    const setActive = jest.fn();
    mockRouter.setCurrentUrl("?query=default+value");
    render(<View setActive={setActive} />, {
      wrapper,
    });
    const input = screen.getByLabelText(t("search:form.keywords.field_label"));
    expect(input).toHaveValue("default value");
    userEvent.click(
      screen.getByRole("button", {
        name: t("search:form.keywords.clear_field_action_a11y_label"),
      })
    );
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(setActive).toBeCalledWith({});
    });
  });

  it("clears location search and all other filters correctly", async () => {
    const setActive = jest.fn();
    mockRouter.setCurrentUrl(
      "?location=default+location&lat=2&lng=2&lastActive=7"
    );
    render(<View setActive={setActive} />, {
      wrapper,
    });
    const input = screen.getByLabelText(t("search:form.location_field_label"));
    expect(input).toHaveValue("default location");
    //button role doesn't seem to work, despite it being there
    userEvent.click(await screen.findByTitle("Clear"));
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(setActive).toBeCalledWith({});
    });
  });

  it("opens and closes the filter dialog, with changes applied to search box", async () => {
    const setActive = jest.fn();
    render(<View setActive={setActive} />, { wrapper });
    userEvent.click(
      screen.getByLabelText(t("search:form.by_keyword_filter_label"))
    );
    const input = screen.getByLabelText(t("search:form.keywords.field_label"));
    userEvent.type(input, "test search");
    await waitFor(() => {
      expect(setActive).toBeCalledWith({ query: "test search" });
    });
    userEvent.click(
      screen.getByRole("button", {
        name: t("search:filter_dialog.desktop_title"),
      })
    );

    const dialog = screen.getByRole("dialog", {
      name: t("search:filter_dialog.desktop_title"),
    });
    expect(dialog).toBeVisible();
    const dialogKeywordsField = within(dialog).getByLabelText(
      t("search:form.keywords.field_label")
    );
    expect(dialogKeywordsField).toHaveValue("test search");
    userEvent.clear(dialogKeywordsField);
    userEvent.type(dialogKeywordsField, "new search");
    userEvent.click(
      screen.getByRole("button", { name: t("search:form.submit_button_label") })
    );
    await waitFor(
      () => {
        expect(dialog).not.toBeVisible();
      },
      { timeout: 5000 }
    );

    expect(input).toHaveValue("new search");
  });
});
