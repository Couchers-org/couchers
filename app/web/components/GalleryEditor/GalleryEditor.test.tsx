import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import galleryFixtures from "test/fixtures/gallery.json";
import wrapper from "test/hookWrapper";
import * as nativeLink from "utils/nativeLink";

import GalleryEditor from "./GalleryEditor";

jest.mock("service");
jest.mock("utils/nativeLink", () => ({
  ...jest.requireActual("utils/nativeLink"),
  useNativeImagePicker: jest.fn(),
}));

const mockGetGallery = service.gallery.getGallery as jest.Mock;
const mockGetGalleryEditInfo = service.gallery.getGalleryEditInfo as jest.Mock;
const mockUploadFile = service.api.uploadFile as jest.Mock;
const mockAddPhotoToGallery = service.gallery.addPhotoToGallery as jest.Mock;
const mockUseNativeImagePicker =
  nativeLink.useNativeImagePicker as jest.MockedFunction<
    typeof nativeLink.useNativeImagePicker
  >;

describe("GalleryEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to web (non-native) mode
    mockUseNativeImagePicker.mockReturnValue({
      isNative: false,
      pickImage: jest.fn(),
    });
  });

  it("renders loading state initially", () => {
    mockGetGallery.mockImplementation(() => new Promise(() => {}));
    mockGetGalleryEditInfo.mockImplementation(() => new Promise(() => {}));

    render(<GalleryEditor galleryId={1} />, { wrapper });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders gallery with photos", async () => {
    const gallery = galleryFixtures.galleries[0];
    const editInfo = galleryFixtures.editInfo[0];

    mockGetGallery.mockResolvedValue(gallery);
    mockGetGalleryEditInfo.mockResolvedValue(editInfo);

    render(
      <GalleryEditor
        galleryId={1}
        title="Test Gallery"
        description="Test description"
      />,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByText("Test Gallery")).toBeInTheDocument();
    });

    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("3 of 4")).toBeInTheDocument();

    // Check that images are rendered
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
  });

  it("shows empty state when gallery has no photos", async () => {
    const gallery = galleryFixtures.galleries[2]; // Empty gallery with canEdit=true
    const editInfo = galleryFixtures.editInfo[1];

    mockGetGallery.mockResolvedValue(gallery);
    mockGetGalleryEditInfo.mockResolvedValue(editInfo);

    render(<GalleryEditor galleryId={3} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Add your first photo")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Click here or the button above to upload a photo"),
    ).toBeInTheDocument();
  });

  it("shows primary badge on first photo", async () => {
    const gallery = galleryFixtures.galleries[0];
    const editInfo = galleryFixtures.editInfo[0];

    mockGetGallery.mockResolvedValue(gallery);
    mockGetGalleryEditInfo.mockResolvedValue(editInfo);

    render(<GalleryEditor galleryId={1} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });
  });

  it("hides edit controls when canEdit is false", async () => {
    const gallery = galleryFixtures.galleries[1]; // canEdit = false

    mockGetGallery.mockResolvedValue(gallery);
    // Edit info not needed when canEdit is false
    mockGetGalleryEditInfo.mockResolvedValue(null);

    render(<GalleryEditor galleryId={2} />, { wrapper });

    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
    });

    // Add photo button should not be present
    expect(screen.queryByText("Add photo")).not.toBeInTheDocument();
  });

  it("shows add photo button when canEdit is true", async () => {
    const gallery = galleryFixtures.galleries[0];
    const editInfo = galleryFixtures.editInfo[0];

    mockGetGallery.mockResolvedValue(gallery);
    mockGetGalleryEditInfo.mockResolvedValue(editInfo);

    render(<GalleryEditor galleryId={1} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Add photo")).toBeInTheDocument();
    });
  });

  it("returns null when galleryId is undefined", () => {
    const { container } = render(<GalleryEditor galleryId={undefined} />, {
      wrapper,
    });

    expect(container.firstChild).toBeNull();
  });

  it("shows verification message when at photo limit without strong verification", async () => {
    const gallery = galleryFixtures.galleries[0]; // Has 3 photos
    const editInfo = {
      ...galleryFixtures.editInfo[0],
      maxPhotos: 3, // Set to current photo count to trigger limit
    };

    mockGetGallery.mockResolvedValue(gallery);
    mockGetGalleryEditInfo.mockResolvedValue(editInfo);

    render(<GalleryEditor galleryId={1} hasStrongVerification={false} />, {
      wrapper,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Complete strong verification to add more photos/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Get verified")).toBeInTheDocument();
  });

  it("does not show verification message when user has strong verification", async () => {
    const gallery = galleryFixtures.galleries[0];
    const editInfo = {
      ...galleryFixtures.editInfo[0],
      canAddMore: false, // At limit
    };

    mockGetGallery.mockResolvedValue(gallery);
    mockGetGalleryEditInfo.mockResolvedValue(editInfo);

    render(<GalleryEditor galleryId={1} hasStrongVerification={true} />, {
      wrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("3 of 4")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Complete strong verification to add more photos/i),
    ).not.toBeInTheDocument();
  });

  describe("image upload", () => {
    it("uses file input for web (non-native) upload", async () => {
      const gallery = galleryFixtures.galleries[0];
      const editInfo = galleryFixtures.editInfo[0];

      mockGetGallery.mockResolvedValue(gallery);
      mockGetGalleryEditInfo.mockResolvedValue(editInfo);
      mockUseNativeImagePicker.mockReturnValue({
        isNative: false,
        pickImage: jest.fn(),
      });

      render(<GalleryEditor galleryId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("Add photo")).toBeInTheDocument();
      });

      // File input should exist for web
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it("uses native image picker in mobile app", async () => {
      const gallery = galleryFixtures.galleries[0];
      const editInfo = galleryFixtures.editInfo[0];

      mockGetGallery.mockResolvedValue(gallery);
      mockGetGalleryEditInfo.mockResolvedValue(editInfo);

      const mockPickImage = jest.fn().mockResolvedValue({
        success: true,
        imageBase64: "dGVzdGltYWdl", // "testimage" in base64
        mimeType: "image/jpeg",
      });

      mockUseNativeImagePicker.mockReturnValue({
        isNative: true,
        pickImage: mockPickImage,
      });

      mockUploadFile.mockResolvedValue({ key: "upload-key-123" });
      mockAddPhotoToGallery.mockResolvedValue({});

      const user = userEvent.setup();

      render(<GalleryEditor galleryId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("Add photo")).toBeInTheDocument();
      });

      // Click add photo button
      await user.click(screen.getByText("Add photo"));

      // Native picker should be called
      await waitFor(() => {
        expect(mockPickImage).toHaveBeenCalled();
      });

      // Upload should be called with the converted file
      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it("handles native picker cancellation gracefully", async () => {
      const gallery = galleryFixtures.galleries[0];
      const editInfo = galleryFixtures.editInfo[0];

      mockGetGallery.mockResolvedValue(gallery);
      mockGetGalleryEditInfo.mockResolvedValue(editInfo);

      const mockPickImage = jest.fn().mockResolvedValue({
        success: false,
        canceled: true,
      });

      mockUseNativeImagePicker.mockReturnValue({
        isNative: true,
        pickImage: mockPickImage,
      });

      const user = userEvent.setup();

      render(<GalleryEditor galleryId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("Add photo")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Add photo"));

      await waitFor(() => {
        expect(mockPickImage).toHaveBeenCalled();
      });

      // Should not call upload when canceled
      expect(mockUploadFile).not.toHaveBeenCalled();
      // Should not show error for cancellation
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows error when native picker fails", async () => {
      const gallery = galleryFixtures.galleries[0];
      const editInfo = galleryFixtures.editInfo[0];

      mockGetGallery.mockResolvedValue(gallery);
      mockGetGalleryEditInfo.mockResolvedValue(editInfo);

      const mockPickImage = jest.fn().mockResolvedValue({
        success: false,
        error: "Camera permission denied",
      });

      mockUseNativeImagePicker.mockReturnValue({
        isNative: true,
        pickImage: mockPickImage,
      });

      const user = userEvent.setup();

      render(<GalleryEditor galleryId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText("Add photo")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Add photo"));

      await waitFor(() => {
        expect(
          screen.getByText("Camera permission denied"),
        ).toBeInTheDocument();
      });
    });
  });
});
