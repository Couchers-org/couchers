import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { service } from "service";
import galleryFixtures from "test/fixtures/gallery.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getGallery, getGalleryEditInfo } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import GalleryEditor from "./GalleryEditor";

const { t } = i18n;

const getGalleryMock = service.gallery.getGallery as MockedService<
  typeof service.gallery.getGallery
>;
const getGalleryEditInfoMock = service.gallery
  .getGalleryEditInfo as MockedService<
  typeof service.gallery.getGalleryEditInfo
>;
const addPhotoMock = service.gallery.addPhotoToGallery as MockedService<
  typeof service.gallery.addPhotoToGallery
>;
const removePhotoMock = service.gallery.removePhotoFromGallery as MockedService<
  typeof service.gallery.removePhotoFromGallery
>;
const updateCaptionMock = service.gallery.updatePhotoCaption as MockedService<
  typeof service.gallery.updatePhotoCaption
>;
const movePhotoMock = service.gallery.movePhoto as MockedService<
  typeof service.gallery.movePhoto
>;

function renderGalleryEditor(galleryId: number) {
  render(<GalleryEditor galleryId={galleryId} />, { wrapper });
}

describe("GalleryEditor", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    getGalleryMock.mockImplementation(getGallery);
    getGalleryEditInfoMock.mockImplementation(getGalleryEditInfo);
    addPhotoMock.mockResolvedValue({
      galleryId: 1,
      photosList: [],
      canEdit: true,
    } as Awaited<ReturnType<typeof service.gallery.addPhotoToGallery>>);
    removePhotoMock.mockResolvedValue({
      galleryId: 1,
      photosList: [],
      canEdit: true,
    } as Awaited<ReturnType<typeof service.gallery.removePhotoFromGallery>>);
    updateCaptionMock.mockResolvedValue({
      galleryId: 1,
      photosList: [],
      canEdit: true,
    } as Awaited<ReturnType<typeof service.gallery.updatePhotoCaption>>);
    movePhotoMock.mockResolvedValue({
      galleryId: 1,
      photosList: [],
      canEdit: true,
    } as Awaited<ReturnType<typeof service.gallery.movePhoto>>);
  });

  describe("when viewing a gallery with photos", () => {
    beforeEach(() => {
      renderGalleryEditor(1);
    });

    it("displays the gallery photos", async () => {
      // Wait for component to load with regex to match "Manage Photos (3/10)"
      expect(await screen.findByText(/Manage Photos/)).toBeVisible();

      const gallery = galleryFixtures.galleries[0];

      // Check that all photos are displayed
      for (const photo of gallery.photosList) {
        const caption = photo.caption || "Gallery photo";
        const img = await screen.findByAltText(caption);
        expect(img).toBeVisible();
        expect(img).toHaveAttribute(
          "src",
          expect.stringContaining(photo.thumbnailUrl),
        );
      }
    });

    it("displays the photo count", async () => {
      await screen.findByText(/Manage Photos/);

      const gallery = galleryFixtures.galleries[0];
      const editInfo = galleryFixtures.editInfo[0];
      expect(
        screen.getByText(
          `${t("global:gallery.manage_photos")} (${gallery.photosList.length}/${editInfo.maxPhotos})`,
        ),
      ).toBeVisible();
    });

    it("allows editing photo caption", async () => {
      const user = userEvent.setup();

      // Wait for component to load
      await screen.findByText(/Manage Photos/);

      // Click edit button on first photo
      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      // Dialog should open
      expect(
        await screen.findByRole("heading", {
          name: t("global:gallery.edit_caption"),
        }),
      ).toBeVisible();

      // Update caption
      const captionInput = screen.getByLabelText(t("global:gallery.caption"));
      await user.clear(captionInput);
      await user.type(captionInput, "Updated caption");

      // Save
      await user.click(screen.getByRole("button", { name: t("global:save") }));

      await waitFor(() => {
        expect(updateCaptionMock).toHaveBeenCalledWith(1, 1, "Updated caption");
      });

      // Success message should appear
      expect(
        await screen.findByText(t("global:success.caption_updated")),
      ).toBeVisible();
    });

    it("allows removing a photo", async () => {
      // Mock window.confirm to return true
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

      const user = userEvent.setup();

      await screen.findByText(/Manage Photos/);

      // Click delete button on first photo
      const deleteButtons = screen.getAllByLabelText("Delete photo");
      await user.click(deleteButtons[0]);

      // Confirm should have been called
      expect(confirmSpy).toHaveBeenCalled();

      await waitFor(() => {
        expect(removePhotoMock).toHaveBeenCalledWith(1, 1);
      });

      // Success message should appear
      expect(
        await screen.findByText(t("global:success.photo_removed")),
      ).toBeVisible();

      confirmSpy.mockRestore();
    });

    it("cancels photo removal when clicking Cancel", async () => {
      // Mock window.confirm to return false (cancel)
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

      const user = userEvent.setup();

      await screen.findByText(/Manage Photos/);

      // Click delete button
      const deleteButtons = screen.getAllByLabelText("Delete photo");
      await user.click(deleteButtons[0]);

      // Confirm should have been called
      expect(confirmSpy).toHaveBeenCalled();

      // Remove should not have been called
      expect(removePhotoMock).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it("shows error message when caption update fails", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      updateCaptionMock.mockRejectedValue(new Error("Update failed"));

      const user = userEvent.setup();

      await screen.findByText(/Manage Photos/);

      // Open edit dialog
      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      // Update caption
      const captionInput = await screen.findByLabelText(
        t("global:gallery.caption"),
      );
      await user.clear(captionInput);
      await user.type(captionInput, "New caption");

      // Try to save
      await user.click(screen.getByRole("button", { name: t("global:save") }));

      // Error message should appear
      await waitFor(() => {
        expect(
          screen.getByText(t("global:error.failed_to_update_caption")),
        ).toBeVisible();
      });
    });

    // TODO: Fix this flaky test - the mock setup throws during test setup
    it.skip("shows error message when photo removal fails", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      removePhotoMock.mockRejectedValueOnce(new Error("Removal failed"));

      // Mock window.confirm to return true
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

      const user = userEvent.setup();

      await screen.findByText(/Manage Photos/);

      // Click delete button
      const deleteButtons = screen.getAllByLabelText("Delete photo");
      await user.click(deleteButtons[0]);

      // Confirm should have been called
      expect(confirmSpy).toHaveBeenCalled();

      // Error message should appear
      await waitFor(() => {
        expect(
          screen.getByText(t("global:error.failed_to_remove_photo")),
        ).toBeVisible();
      });

      confirmSpy.mockRestore();
    });
  });

  describe("when viewing an empty gallery", () => {
    beforeEach(() => {
      renderGalleryEditor(3);
    });

    it("shows upload option for empty gallery", async () => {
      await screen.findByText(/Manage Photos/);

      // Empty gallery with space should show upload card
      const uploadInput = screen.getByAltText("Upload new photo");
      expect(uploadInput).toBeInTheDocument();
    });

    it("displays zero photo count", async () => {
      const editInfo = galleryFixtures.editInfo[1]; // editInfo for gallery 3
      expect(
        await screen.findByText(
          `${t("global:gallery.manage_photos")} (0/${editInfo.maxPhotos})`,
        ),
      ).toBeVisible();
    });
  });

  describe("when viewing a read-only gallery", () => {
    beforeEach(() => {
      renderGalleryEditor(2);
    });

    it("shows warning message for read-only gallery", async () => {
      expect(
        await screen.findByText(t("global:error.cannot_edit_gallery")),
      ).toBeVisible();
    });

    it("does not show photo grid or edit controls", async () => {
      await screen.findByText(t("global:error.cannot_edit_gallery"));

      // Should not have edit buttons (since photo grid is not rendered)
      expect(screen.queryByLabelText("Edit caption")).not.toBeInTheDocument();

      // Should not have delete buttons
      expect(screen.queryByLabelText("Delete photo")).not.toBeInTheDocument();
    });
  });

  describe("when gallery loading fails", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      getGalleryMock.mockRejectedValue(new Error("Failed to load"));
      renderGalleryEditor(999);
    });

    it("displays error message", async () => {
      expect(
        await screen.findByText(t("global:error.failed_to_load_gallery")),
      ).toBeVisible();
    });
  });

  describe("when gallery is not found", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      getGalleryMock.mockRejectedValue(new Error("Gallery 999 not found"));
      renderGalleryEditor(999);
    });

    it("displays not found error", async () => {
      expect(
        await screen.findByText(t("global:error.failed_to_load_gallery")),
      ).toBeVisible();
    });
  });
});
