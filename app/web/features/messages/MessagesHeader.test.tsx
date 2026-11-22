import { render, screen } from "@testing-library/react";
import MessagesHeader from "features/messages/MessagesHeader";
import React from "react";
import wrapper from "test/hookWrapper";
import { addDefaultUser } from "test/utils";

describe("MessagesHeader", () => {
  beforeEach(() => {
    addDefaultUser();
  });

  it("renders the messages page title", () => {
    render(<MessagesHeader tab="all" />, { wrapper });

    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("renders the mark all read button when tab is 'all'", () => {
    render(<MessagesHeader tab="all" />, { wrapper });

    expect(screen.getByText("Mark all as read")).toBeInTheDocument();
  });
});
