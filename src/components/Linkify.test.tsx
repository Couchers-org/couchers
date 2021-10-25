import { render, screen } from "@testing-library/react";
import React from "react";

import Linkify from "./Linkify";

test("renders links as anchor tags with correct href attributes", () => {
  const testMessages = [
    {
      text: "I really do all my shopping on amazon.es.",
      searchTerm: /amazon\.es/,
      href: "//amazon.es",
    },
    {
      text: "www is uncool, I only use old.reddit.com",
      searchTerm: /reddit\.com/,
      href: "//old.reddit.com",
    },
    {
      text: "www.google.com",
      searchTerm: /www\.google\.com/,
      href: "//www.google.com",
    },
    {
      text: "this should answer your question: https://stackoverflow.com/questions/57827126/how-to-test-anchors-href-with-react-testing-library",
      searchTerm: /how-to-test-anchors-href-with-react-testing-library/,
      href: "https://stackoverflow.com/questions/57827126/how-to-test-anchors-href-with-react-testing-library",
    },
    {
      text: "if you want to know your ip: https://duckduckgo.com/?q=what+is+my+ip&t=h_&ia=answer",
      searchTerm: /ia=answer/,
      href: "https://duckduckgo.com/?q=what+is+my+ip&t=h_&ia=answer",
    },
  ];
  for (const message of testMessages) {
    render(<Linkify text={message.text} />);
    const linkElement = screen.getByText(message.searchTerm);
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", message.href);
  }
});
