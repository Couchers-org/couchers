import useCurrentUser from "features/userQueries/useCurrentUser";
import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import SearchPage from "./SearchPage";
import { User } from "proto/api_pb";
import { service } from "service";
import { MockedService, mockConsoleError } from "test/utils";

jest.mock("features/userQueries/useCurrentUser");
jest.mock("maplibre-gl", () => {
  return {
    getBounds: [0, 0, 0, 0],
  };
});

const userSearchMock = service.search.userSearch as MockedService<
  typeof service.search.userSearch
>;

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

describe("SearchPage", () => {
  beforeEach(() => {
    useCurrentUserMock.mockReturnValue({
      data: {
        username: "aapeli",
      } as User.AsObject,
      isError: false,
      isFetching: false,
      isLoading: false,
      error: "",
    });
  });

  it("Shows an error if the search fails", async () => {
    mockConsoleError();
    userSearchMock.mockRejectedValueOnce(new Error("search error"));

    render(<SearchPage locationName="" bbox={[0, 0, 0, 0]} />, { wrapper });

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent("search error");
  });

  it("Don't show an error if the search works", async () => {
    mockConsoleError();

    render(<SearchPage locationName="" bbox={[0, 0, 0, 0]} />, { wrapper });

    await expect(screen.findByRole("alert")).rejects.toThrow();
  });
});
