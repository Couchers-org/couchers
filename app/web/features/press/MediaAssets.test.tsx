import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import MediaAssets from "./MediaAssets";

const { t } = i18n;

describe("MediaAssets", () => {
  it("mobile image has alt text", () => {
    render(<MediaAssets />, { wrapper });
    expect(
      screen.getByAltText(t("press:mobile_image_alt")),
    ).toBeInTheDocument();
  });

  it("download buttons have distinct aria-labels", () => {
    render(<MediaAssets />, { wrapper });
    expect(
      screen.getByRole("link", { name: t("press:download_logo_aria_label") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: t("press:download_mobile_images_aria_label"),
      }),
    ).toBeInTheDocument();
  });

  it("download links point to correct files", () => {
    render(<MediaAssets />, { wrapper });
    expect(
      screen.getByRole("link", { name: t("press:download_logo_aria_label") }),
    ).toHaveAttribute("href", "/img/press/downloads/couchers-logo-assets.zip");
    expect(
      screen.getByRole("link", {
        name: t("press:download_mobile_images_aria_label"),
      }),
    ).toHaveAttribute(
      "href",
      "/img/press/downloads/couchers-mobile-images.zip",
    );
  });

  it("download links have download attributes", () => {
    render(<MediaAssets />, { wrapper });
    expect(
      screen.getByRole("link", { name: t("press:download_logo_aria_label") }),
    ).toHaveAttribute("download", "couchers-logo-assets.zip");
    expect(
      screen.getByRole("link", {
        name: t("press:download_mobile_images_aria_label"),
      }),
    ).toHaveAttribute("download", "couchers-mobile-images.zip");
  });
});
