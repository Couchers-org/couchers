import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "test/restMock";
import { useState } from "react";
import { t } from "test/utils";

import SearchBox from "./SearchBox";

const View = ({
  searchTypeParam = "keyword",
}: {
  searchTypeParam?: "keyword" | "location";
}) => {
  const [searchType, setSearchType] = useState(searchTypeParam);
  const [queryNameProp, setQueryNameProp] = useState("");
  const [locationResultProp, setLocationResultProp] = useState({});

  return (
    <SearchBox
      searchType={searchType}
      setSearchType={setSearchType as any}
      setLocationResult={setLocationResultProp}
      locationResult={locationResultProp}
      setQueryName={setQueryNameProp}
      queryName={queryNameProp}
    />
  );
};

describe("SearchBox", () => {
  it("performs a keyword search", async () => {
    render(<View />);

    userEvent.click(
      screen.getByLabelText(t("search:form.by_keyword_filter_label"))
    );

    const input = screen.getByLabelText(t("search:form.keywords.field_label"));
    userEvent.type(input, "test");

    await waitFor(() => {
      expect(input).toHaveValue("test");
    });
  });

  it("clears keyword search correctly", async () => {
    render(<View />);

    const input = screen.getByLabelText(t("search:form.keywords.field_label"));

    userEvent.type(input, "default value");

    expect(input).toHaveValue("default value");

    userEvent.click(
      screen.getByRole("button", {
        name: t("search:form.keywords.clear_field_action_a11y_label"),
      })
    );

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  describe("with mocked location search", () => {
    beforeEach(() => {
      server.listen();
    });

    afterEach(() => {
      server.close();
    });

    it("result from list is choosable", async () => {
      render(<View />);

      userEvent.click(
        screen.getByLabelText(t("search:form.by_location_filter_label"))
      );

      const input = screen.getByLabelText(
        t("search:form.location_field_label")
      );

      userEvent.type(input, "tes{enter}");
      userEvent.click(await screen.findByText("test city, test country"));

      await waitFor(() => {
        expect(input).toHaveValue("test city, test country");
      });
    });
  });

  /*
  it.only("shows default keyword field with a default value from url", async () => {
    mockRouter.setCurrentUrl("?query=default+value");
    render(
      <SearchBox
        searchType={"location"}
        setSearchType={setSearchType}
        locationResult={locationResultProp}
        setLocationResult={setLocationResultProp}
        setQueryName={setQueryNameProp}
        queryName={queryNameProp}
    />);
    
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
  
  it("opens and closes the filter dialog, with changes applied to search box", async () => {
    const setActive = jest.fn();
    render(<View />, { wrapper });
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
  */
});
