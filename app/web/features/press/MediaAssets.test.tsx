import { render, screen } from "@testing-library/react";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import MediaAssets from "./MediaAssets";

const { t } = i18n;

describe("MediaAssets", () => {
  it("download links point to correct files", () => {
    render(<MediaAssets />, { wrapper });

    expect(screen.getByRole("link", { name: t("press:download.logo_aria_label") })).toHaveAttribute(
      "href",
      "/img/press/downloads/couchers-logo-assets.zip",
    );
    expect(screen.getByRole("link", { name: t("press:download.logo_aria_label") })).toHaveAttribute(
      "download",
      "couchers-logo-assets.zip",
    );

    expect(
      screen.getByRole("link", {
        name: t("press:download.mobile_images_aria_label"),
      }),
    ).toHaveAttribute("href", "/img/press/downloads/couchers-mobile-images.zip");
    expect(
      screen.getByRole("link", {
        name: t("press:download.mobile_images_aria_label"),
      }),
    ).toHaveAttribute("download", "couchers-mobile-images.zip");
  });
});
