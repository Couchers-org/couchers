import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React, { useState } from "react";
import { service } from "service";
import wrapper from "test/hookWrapper";

import { ADD_FRIEND } from "../constants";
import AddFriendButton from "./AddFriendButton";

const sendFriendRequestMock = service.api.sendFriendRequest as jest.Mock<
  ReturnType<typeof service.api.sendFriendRequest>
>;

function TestComponent() {
  const [mutationError, setMutationError] = useState("");

  return (
    <>
      {mutationError ? <p>{mutationError}</p> : <p>Success!</p>}
      <AddFriendButton userId={2} setMutationError={setMutationError} />
    </>
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AddFriendButton", () => {
  it("renders the button correctly", () => {
    render(<TestComponent />, { wrapper });
    expect(screen.getByRole("button", { name: ADD_FRIEND })).toBeVisible();
  });

  it("shows loading state correctly if the add friend action is still running", async () => {
    // A never resolving promise will always be pending...
    sendFriendRequestMock.mockImplementation(() => new Promise(() => void 0));
    render(<TestComponent />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: ADD_FRIEND }));
    expect(await screen.findByRole("progressbar")).toBeVisible();
  });

  it("sets no error if the add friend action succeeded", async () => {
    sendFriendRequestMock.mockResolvedValue(new Empty());
    render(<TestComponent />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: ADD_FRIEND }));

    expect(await screen.findByText(/Success/)).toBeInTheDocument();
  });

  it("sets an error if the add friend action failed", async () => {
    jest.spyOn(console, "error").mockReturnValue(undefined);
    sendFriendRequestMock.mockRejectedValue(
      new Error("Failed to add funny dog")
    );
    render(<TestComponent />, { wrapper });

    userEvent.click(screen.getByRole("button", { name: ADD_FRIEND }));
    expect(
      await screen.findByText("Failed to add funny dog")
    ).toBeInTheDocument();
  });
});
