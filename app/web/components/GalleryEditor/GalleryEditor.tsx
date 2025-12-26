import { AddPhotoAlternate, InfoOutlined } from "@mui/icons-material";
import {
  Box,
  ImageList,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Alert from "components/Alert";
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
import { settingsRoute } from "routes";
import { service } from "service";

import GalleryItem from "./GalleryItem";

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
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.grey[200]}`,
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
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius * 2,
  border: `2px dashed ${theme.palette.grey[300]}`,
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.primary.main,
  },
}));

const EmptyStateIcon = styled(AddPhotoAlternate)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.grey[400],
  marginBottom: theme.spacing(2),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4),
}));

const PhotoCountBadge = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
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
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [showReorderSuccess, setShowReorderSuccess] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Touch support for mobile
  const [touchStartItemId, setTouchStartItemId] = useState<number | null>(null);

  const { data: gallery, isLoading: galleryLoading } = useGallery(galleryId);
  const { data: editInfo, isLoading: editInfoLoading } =
    useGalleryEditInfo(galleryId);

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
  const photos: GalleryItemData[] = (gallery?.photosList ??
    []) as GalleryItemData[];
  const maxPhotos = editInfo?.maxPhotos ?? 0;
  const currentPhotoCount = photos.length;
  const canAddMore = currentPhotoCount < maxPhotos;

  // Get column count based on screen size
  const getCols = () => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4;
  };

  const handleUploadClick = () => {
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
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
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
    setDragOverItemId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItemId(targetItemId);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    const draggedId = draggedItemId;
    setDraggedItemId(null);
    setDragOverItemId(null);

    if (!draggedId || draggedId === targetItemId) return;

    // Find the positions of dragged and target items
    const draggedIndex = photos.findIndex((p) => p.itemId === draggedId);
    const targetIndex = photos.findIndex((p) => p.itemId === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Determine afterItemId:
    // - If dropping at first position (targetIndex === 0 and dragged is after), afterItemId = 0
    // - Otherwise, afterItemId = the item we want to place after
    let afterItemId: number;

    if (draggedIndex > targetIndex) {
      // Moving left/up - place after the item before target
      afterItemId = targetIndex === 0 ? 0 : photos[targetIndex - 1].itemId;
    } else {
      // Moving right/down - place after target
      afterItemId = targetItemId;
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

    // Find which item we're currently over
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const imageListItem = element?.closest("[data-item-id]");

    if (imageListItem) {
      const itemId = Number(imageListItem.getAttribute("data-item-id"));
      if (itemId && itemId !== touchStartItemId) {
        setDragOverItemId(itemId);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!touchStartItemId || !dragOverItemId) {
      setTouchStartItemId(null);
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const draggedId = touchStartItemId;
    const targetItemId = dragOverItemId;

    setTouchStartItemId(null);
    setDraggedItemId(null);
    setDragOverItemId(null);

    if (draggedId === targetItemId) return;

    // Find the positions of dragged and target items
    const draggedIndex = photos.findIndex((p) => p.itemId === draggedId);
    const targetIndex = photos.findIndex((p) => p.itemId === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Determine afterItemId
    let afterItemId: number;

    if (draggedIndex > targetIndex) {
      afterItemId = targetIndex === 0 ? 0 : photos[targetIndex - 1].itemId;
    } else {
      afterItemId = targetItemId;
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
              <Typography variant="h3" gutterBottom>
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary">
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
                startIcon={
                  isUploading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <AddPhotoAlternate />
                  )
                }
                onClick={handleUploadClick}
                disabled={!canAddMore || isUploading}
              >
                {isUploading
                  ? t("profile:gallery.uploading")
                  : t("profile:gallery.add_photo")}
              </UploadButton>
            </Box>
          )}
        </HeaderRow>

        {canEdit && photos.length > 0 && (
          <>
            {!canAddMore && !hasStrongVerification && (
              <InfoBox
                sx={{
                  backgroundColor: theme.palette.grey[50],
                  border: `1px solid ${theme.palette.grey[300]}`,
                  marginTop: 1,
                }}
              >
                <InfoOutlined fontSize="small" sx={{ color: "primary.main" }} />
                <Typography variant="body2" color="text.secondary">
                  {t("profile:gallery.verification_required_for_more_photos")}{" "}
                  <a
                    href={`${settingsRoute}#strong-verification`}
                    style={{ color: theme.palette.primary.main }}
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
            <Typography variant="h3" gutterBottom>
              {t("profile:gallery.empty_title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("profile:gallery.empty_description")}
            </Typography>
          </EmptyState>
        ) : (
          <EmptyState sx={{ cursor: "default", "&:hover": {} }}>
            <EmptyStateIcon />
            <Typography variant="body2" color="text.secondary">
              {t("profile:gallery.no_photos")}
            </Typography>
          </EmptyState>
        )
      ) : (
        <StyledImageList cols={getCols()} gap={12} rowHeight={180}>
          {photos.map((item, index) => (
            <GalleryItem
              key={item.itemId}
              item={item}
              isFirst={index === 0}
              isDragging={draggedItemId === item.itemId}
              isDragOver={dragOverItemId === item.itemId}
              isDeleting={deletingItemId === item.itemId}
              canEdit={canEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          ))}
        </StyledImageList>
      )}
    </Root>
  );
}
