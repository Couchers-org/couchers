import { render, screen } from "@testing-library/react";
import { facebookURL, githubURL, instagramURL, redditURL } from "routes";
import wrapper from "test/hookWrapper";

import SocialMediaLinks from "./SocialMediaLinks";

const socialLinks = [
  { label: "GitHub", href: githubURL },
  { label: "Instagram", href: instagramURL },
  { label: "Reddit", href: redditURL },
  { label: "BlueSky", href: "https://bsky.app/profile/couchers.bsky.social" },
  { label: "TikTok", href: "https://www.tiktok.com/@couchersorg" },
  { label: "Facebook", href: facebookURL },
];

describe("SocialMediaLinks", () => {
  it("renders all 6 social links with aria-labels", () => {
    render(<SocialMediaLinks iconSize="1.5rem" />, { wrapper });
    socialLinks.forEach(({ label }) => {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    });
  });

  it("links point to correct URLs", () => {
    render(<SocialMediaLinks iconSize="1.5rem" />, { wrapper });
    socialLinks.forEach(({ label, href }) => {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    });
  });

  it("links open in a new tab", () => {
    render(<SocialMediaLinks iconSize="1.5rem" />, { wrapper });
    socialLinks.forEach(({ label }) => {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "target",
        "_blank",
      );
    });
  });
});
