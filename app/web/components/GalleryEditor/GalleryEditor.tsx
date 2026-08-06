import { AddPhotoAlternate, InfoOutlined } from "@mui/icons-material";
import { Box, ImageList, styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import BetaFlag from "components/BetaFlag";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import {
  useAddPhotoToGallery,
  useGallery,
  useGalleryEditInfo,
  useMovePhoto,
  useRemovePhotoFromGallery,
} from "features/profile/hooks/useGallery";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import Sentry from "platform/sentry";
import React, { useEffect, useRef, useState } from "react";
import { verificationRoute } from "routes";
import { service } from "service";
import { base64ToFile, useNativeImagePicker } from "utils/nativeLink";

import GalleryItem, { DropPlaceholder } from "./GalleryItem";

export interface GalleryItemData {
  itemId: number;
  fullUrl: string;
  thumbnailUrl: string;
  caption: string;
}

interface GalleryEditorProps {
  galleryId: number | undefined;
  userId?: number;
  title?: string;
  description?: string;
  hasStrongVerification?: boolean;
}

const Root = styled(Box)(({ theme }) => ({
  width: "100%",
}));

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const HeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const InfoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: theme.shape.borderRadius,
  border: "1px solid var(--mui-palette-grey-200)",
}));

const StyledImageList = styled(ImageList)(({ theme }) => ({
  width: "100%",
  borderRadius: theme.shape.borderRadius * 2,
  margin: 0,
}));

const UploadButton = styled(Button)(({ theme }) => ({
  minWidth: 140,
}));

const HiddenInput = styled("input")({
  display: "none",
});

const EmptyState = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6),
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: theme.shape.borderRadius * 2,
  border: "2px dashed var(--mui-palette-grey-300)",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "var(--mui-palette-grey-100)",
    borderColor: "var(--mui-palette-primary-main)",
  },
}));

const EmptyStateIcon = styled(AddPhotoAlternate)(({ theme }) => ({
  fontSize: 64,
  color: "var(--mui-palette-grey-400)",
  marginBottom: theme.spacing(2),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4),
}));

const PhotoCountBadge = styled(Typography)(({ theme }) => ({
  color: "var(--mui-palette-text-secondary)",
  fontSize: "0.875rem",
}));

export default function GalleryEditor({
  galleryId,
  userId,
  title,
  description,
  hasStrongVerification,
}: GalleryEditorProps) {
  const { t } = useTranslation([PROFILE]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const inputRef = useRef<HTMLInputElement>(null);

  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [showReorderSuccess, setShowReorderSuccess] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Touch support for mobile
  const [touchStartItemId, setTouchStartItemId] = useState<number | null>(null);

  // Native image picker for mobile app
  const { isNative, pickImage } = useNativeImagePicker();

  const { data: gallery, isLoading: galleryLoading } = useGallery(galleryId);
  const { data: editInfo, isLoading: editInfoLoading } = useGalleryEditInfo(galleryId);

  const addPhotoMutation = useAddPhotoToGallery(galleryId || 0, userId);
  const removePhotoMutation = useRemovePhotoFromGallery(galleryId || 0, userId);
  const movePhotoMutation = useMovePhoto(galleryId || 0, userId);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (showReorderSuccess) {
      const timer = setTimeout(() => {
        setShowReorderSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showReorderSuccess]);

  useEffect(() => {
    if (showUploadSuccess) {
      const timer = setTimeout(() => {
        setShowUploadSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showUploadSuccess]);

  const canEdit = gallery?.canEdit ?? false;
  const photos: GalleryItemData[] = (gallery?.photosList ?? []) as GalleryItemData[];
  const maxPhotos = editInfo?.maxPhotos ?? 0;
  const currentPhotoCount = photos.length;
  const canAddMore = currentPhotoCount < maxPhotos;

  // Get column count based on screen size
  const getCols = () => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4;
  };

  const handleUploadClick = async () => {
    // Use native image picker in mobile app (WebView file input crashes)
    if (isNative) {
      setIsUploading(true);
      setUploadError(null);
      setShowUploadSuccess(false);
      try {
        const result = await pickImage();
        if (result.success) {
          // Convert base64 to File and upload using existing service
          const file = base64ToFile(
            result.imageBase64,
            result.mimeType,
            `photo.${result.mimeType.split("/")[1] || "jpg"}`,
          );
          const uploadResult = await service.api.uploadFile(file);
          await addPhotoMutation.mutateAsync({ uploadKey: uploadResult.key });
          setShowUploadSuccess(true);
        } else if (!result.canceled) {
          setUploadError(result.error || "Upload failed");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setUploadError(errorMessage);
        Sentry.captureException(error, {
          tags: { component: "GalleryEditor", native: true },
        });
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Standard web file input
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setShowUploadSuccess(false);
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const uploadResult = await service.api.uploadFile(file);
      await addPhotoMutation.mutateAsync({ uploadKey: uploadResult.key });
      setShowUploadSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      Sentry.captureException(error, {
        tags: { component: "GalleryEditor" },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    setDeletingItemId(itemId);
    try {
      await removePhotoMutation.mutateAsync(itemId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "GalleryEditor" },
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(itemId));
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDropIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: number, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedItemId) return;

    const draggedIndex = photos.findIndex((p) => p.itemId === draggedItemId);
    if (draggedIndex === -1) return;

    // Determine drop position based on cursor position within target element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    // Calculate the drop index
    let newDropIndex: number;
    if (isLeftHalf) {
      newDropIndex = targetIndex;
    } else {
      newDropIndex = targetIndex + 1;
    }

    // Adjust for the fact that dragged item will be removed from its position
    if (draggedIndex < newDropIndex) {
      newDropIndex -= 1;
    }

    // Don't show indicator at the current position
    if (newDropIndex === draggedIndex) {
      setDropIndex(null);
    } else {
      setDropIndex(newDropIndex);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = draggedItemId;
    const currentDropIndex = dropIndex;
    setDraggedItemId(null);
    setDropIndex(null);

    if (!draggedId || currentDropIndex === null) return;

    const draggedIndex = photos.findIndex((p) => p.itemId === draggedId);
    if (draggedIndex === -1 || currentDropIndex === draggedIndex) return;

    // Determine afterItemId based on dropIndex
    let afterItemId: number;
    if (currentDropIndex === 0) {
      afterItemId = 0; // Move to first position
    } else {
      // Get the item that will be before our dropped item
      // If dragging forward, account for the shift
      const beforeIndex = draggedIndex < currentDropIndex ? currentDropIndex : currentDropIndex - 1;
      afterItemId = photos[beforeIndex].itemId;
    }

    try {
      await movePhotoMutation.mutateAsync({
        itemId: draggedId,
        afterItemId,
      });
      setShowReorderSuccess(true);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "GalleryEditor" },
      });
    }
  };

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, itemId: number) => {
    if (!canEdit) return;
    setTouchStartItemId(itemId);
    setDraggedItemId(itemId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartItemId) return;

    const touch = e.touches[0];
    const draggedIndex = photos.findIndex((p) => p.itemId === touchStartItemId);
    if (draggedIndex === -1) return;

    // Find which item we're currently over
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const imageListItem = element?.closest("[data-item-id]");

    if (imageListItem) {
      const itemId = Number(imageListItem.getAttribute("data-item-id"));
      const targetIndex = photos.findIndex((p) => p.itemId === itemId);

      if (itemId && targetIndex !== -1) {
        // Determine drop position based on touch position within the element
        const rect = imageListItem.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const isLeftHalf = x < rect.width / 2;

        // Calculate new drop index
        let newDropIndex: number;
        if (isLeftHalf) {
          newDropIndex = targetIndex;
        } else {
          newDropIndex = targetIndex + 1;
        }

        // Adjust for the dragged item being removed
        if (draggedIndex < newDropIndex) {
          newDropIndex -= 1;
        }

        // Don't show indicator at current position
        if (newDropIndex === draggedIndex) {
          setDropIndex(null);
        } else {
          setDropIndex(newDropIndex);
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!touchStartItemId || dropIndex === null) {
      setTouchStartItemId(null);
      setDraggedItemId(null);
      setDropIndex(null);
      return;
    }

    const draggedId = touchStartItemId;
    const currentDropIndex = dropIndex;

    setTouchStartItemId(null);
    setDraggedItemId(null);
    setDropIndex(null);

    const draggedIndex = photos.findIndex((p) => p.itemId === draggedId);
    if (draggedIndex === -1 || currentDropIndex === draggedIndex) return;

    // Determine afterItemId based on dropIndex
    let afterItemId: number;
    if (currentDropIndex === 0) {
      afterItemId = 0;
    } else {
      const beforeIndex = draggedIndex < currentDropIndex ? currentDropIndex : currentDropIndex - 1;
      afterItemId = photos[beforeIndex].itemId;
    }

    try {
      await movePhotoMutation.mutateAsync({
        itemId: draggedId,
        afterItemId,
      });
      setShowReorderSuccess(true);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "GalleryEditor" },
      });
    }
  };

  if (!galleryId) {
    return null;
  }

  if (galleryLoading || editInfoLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  return (
    <Root>
      <Header>
        <HeaderRow>
          <Box>
            {title && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h3" gutterBottom sx={{ mb: 0 }}>
                  {title}
                </Typography>
                <BetaFlag />
              </Box>
            )}
            {description && (
              <Typography
                variant="body2"
                sx={{
                  color: "var(--mui-palette-text-secondary)",
                  mt: 1,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>

          {canEdit && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <PhotoCountBadge>
                {t("profile:gallery.photo_count", {
                  current: currentPhotoCount,
                  total: maxPhotos,
                })}
              </PhotoCountBadge>
              <UploadButton
                variant="contained"
                color="primary"
                startIcon={<AddPhotoAlternate />}
                onClick={handleUploadClick}
                disabled={!canAddMore || isUploading}
                loading={isUploading}
              >
                {t("profile:gallery.add_photo")}
              </UploadButton>
            </Box>
          )}
        </HeaderRow>

        {canEdit && photos.length > 0 && (
          <>
            {!canAddMore && !hasStrongVerification && (
              <InfoBox
                sx={{
                  backgroundColor: "var(--mui-palette-grey-50)",
                  border: `1px solid var(--mui-palette-grey-300)`,
                  marginTop: 1,
                }}
              >
                <InfoOutlined fontSize="small" sx={{ color: "primary.main" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--mui-palette-text-secondary)",
                  }}
                >
                  {t("profile:gallery.verification_required_for_more_photos")}{" "}
                  <a
                    href={verificationRoute}
                    style={{ color: "var(--mui-palette-primary-main)" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("profile:gallery.get_verified")}
                  </a>
                </Typography>
              </InfoBox>
            )}
          </>
        )}
      </Header>
      <HiddenInput
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        aria-label={t("profile:gallery.select_photo")}
      />
      {showReorderSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t("profile:gallery.reorder_success")}
        </Alert>
      )}
      {showUploadSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t("profile:gallery.upload_success")}
        </Alert>
      )}
      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}
      {photos.length === 0 ? (
        canEdit ? (
          <EmptyState onClick={handleUploadClick}>
            <EmptyStateIcon />
            <Typography variant="h3" gutterBottom sx={{ color: "var(--mui-palette-text-primary)" }}>
              {t("profile:gallery.empty_title")}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
              {t("profile:gallery.empty_description")}
            </Typography>
          </EmptyState>
        ) : (
          <EmptyState sx={{ cursor: "default" }}>
            <EmptyStateIcon />
            <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
              {t("profile:gallery.no_photos")}
            </Typography>
          </EmptyState>
        )
      ) : (
        <StyledImageList
          cols={getCols()}
          gap={12}
          rowHeight={180}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(() => {
            const draggedIndex = draggedItemId ? photos.findIndex((p) => p.itemId === draggedItemId) : -1;

            // Determine if this is a touch drag (simpler preview) or mouse drag (full reorder preview)
            const isTouchDrag = touchStartItemId !== null;

            // For MOUSE drag: full reorder preview with items moving
            if (!isTouchDrag && dropIndex !== null && draggedIndex !== -1) {
              // Build a reordered array with placeholder
              const reorderedItems: (GalleryItemData | "placeholder")[] = [];
              let photoIndex = 0;

              for (let i = 0; i <= photos.length; i++) {
                if (i === dropIndex) {
                  // Insert placeholder at drop position
                  reorderedItems.push("placeholder");
                }
                if (photoIndex < photos.length) {
                  // Skip the dragged item in its original position
                  if (photos[photoIndex].itemId === draggedItemId) {
                    photoIndex++;
                  }
                  if (photoIndex < photos.length) {
                    reorderedItems.push(photos[photoIndex]);
                    photoIndex++;
                  }
                }
              }

              // Find index of first real item (not placeholder)
              const firstRealItemIndex = reorderedItems.findIndex((i) => i !== "placeholder");

              return reorderedItems.map((item, renderIndex) => {
                if (item === "placeholder") {
                  return <DropPlaceholder key="drop-placeholder" onDragOver={(e) => e.preventDefault()} />;
                }

                // Find original index for drag handlers
                const originalIndex = photos.findIndex((p) => p.itemId === item.itemId);

                return (
                  <GalleryItem
                    key={item.itemId}
                    item={item}
                    isFirst={renderIndex === firstRealItemIndex}
                    isDragging={false}
                    isDeleting={deletingItemId === item.itemId}
                    canEdit={canEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, item.itemId, originalIndex)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                );
              });
            }

            // For TOUCH drag or normal render: keep items in original order
            // Show placeholder at dropIndex position for touch drag
            const items = photos.map((item, index) => (
              <React.Fragment key={item.itemId}>
                {/* Show placeholder before this item if dropIndex matches */}
                {isTouchDrag && dropIndex === index && <DropPlaceholder key={`drop-placeholder-${index}`} />}
                <GalleryItem
                  item={item}
                  isFirst={index === 0}
                  isDragging={draggedItemId === item.itemId}
                  isDeleting={deletingItemId === item.itemId}
                  canEdit={canEdit}
                  onDelete={handleDelete}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, item.itemId, index)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </React.Fragment>
            ));

            // Add placeholder at end if dropping at last position
            if (isTouchDrag && dropIndex === photos.length) {
              items.push(<DropPlaceholder key="drop-placeholder-end" />);
            }

            return items;
          })()}
        </StyledImageList>
      )}
    </Root>
  );
}
