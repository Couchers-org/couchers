import { render, screen, waitFor } from "@testing-library/react";
import { service } from "service";
import galleryFixtures from "test/fixtures/gallery.json";
import wrapper from "test/hookWrapper";

import GalleryEditor from "./GalleryEditor";

jest.mock("service");

const mockGetGallery = service.gallery.getGallery as jest.Mock;
const mockGetGalleryEditInfo = service.gallery.getGalleryEditInfo as jest.Mock;

describe("GalleryEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(screen.getByText("3 / 10 photos")).toBeInTheDocument();

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
    const gallery = galleryFixtures.galleries[0];
    const editInfo = {
      ...galleryFixtures.editInfo[0],
      canAddMore: false, // At limit
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
      expect(screen.getByText("3 / 10 photos")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Complete strong verification to add more photos/i),
    ).not.toBeInTheDocument();
  });
});
