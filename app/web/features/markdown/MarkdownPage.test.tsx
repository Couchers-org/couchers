import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import MarkdownPage from "./MarkdownPage";

const { t } = i18n;

function renderPost({ showDonateButton }: { showDonateButton: boolean }) {
  render(
    <MarkdownPage
      slug={["blog", "2026", "12", "01", "donation-drive-2026"]}
      frontmatter={{ title: "Donation drive", is_blog_post: true, show_donate_button: showDonateButton }}
      content="<p>Please donate</p>"
    />,
    { wrapper },
  );
}

const donateButtons = () => screen.queryAllByRole("link", { name: t("global:donation_banner.button") });

describe("MarkdownPage", () => {
  it("shows a donate button above and below a post that asks for it", () => {
    renderPost({ showDonateButton: true });

    expect(donateButtons()).toHaveLength(2);
    donateButtons().forEach((button) =>
      expect(button).toHaveAttribute("href", "/donate?utm_source=donation_blog_post"),
    );
  });

  it("doesn't show a donate button on other posts", () => {
    renderPost({ showDonateButton: false });

    expect(donateButtons()).toHaveLength(0);
  });
});
