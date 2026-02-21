import { Close, DragIndicator, Star } from "@mui/icons-material";
import {
  Box,
  IconButton,
  ImageListItem,
  ImageListItemBar,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import CircularProgress from "components/CircularProgress";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import React from "react";

import { GalleryItemData } from "./GalleryEditor";

interface GalleryItemProps {
  item: GalleryItemData;
  isFirst: boolean;
  isDragging: boolean;
  isDeleting: boolean;
  canEdit: boolean;
  onDelete: (itemId: number) => void;
  onDragStart: (e: React.DragEvent, itemId: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent, itemId: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const StyledImageListItem = styled(ImageListItem, {
  shouldForwardProp: (prop) => prop !== "isDragging",
})<{ isDragging: boolean }>(({ theme, isDragging }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  cursor: "grab",
  opacity: isDragging ? 0.4 : 1,
  transform: isDragging ? "scale(0.95)" : undefined,
  transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  "&:hover": {
    boxShadow: isDragging ? undefined : theme.shadows[4],
    "& .drag-handle": {
      opacity: 1,
    },
    "& .MuiImageListItemBar-root": {
      opacity: 1,
    },
  },
  "&:active": {
    cursor: "grabbing",
  },
}));

const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const DragHandle = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  left: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0,
  transition: "opacity 0.2s ease",
  color: theme.palette.common.white,
  cursor: "grab",
  "&:active": {
    cursor: "grabbing",
  },
}));

const PrimaryBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const StyledImageListItemBar = styled(ImageListItemBar)(({ theme }) => ({
  background:
    "linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%)",
  opacity: 0,
  transition: "opacity 0.2s ease",
  "& .MuiImageListItemBar-titleWrap": {
    padding: theme.spacing(1, 1.5),
  },
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
}));

const LoadingOverlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 2,
});

// Placeholder box that shows where the item will be dropped
export const DropPlaceholder = styled(ImageListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: "var(--mui-palette-action-hover)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.8,
  touchAction: "none",
}));

export default function GalleryItem({
  item,
  isFirst,
  isDragging,
  isDeleting,
  canEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: GalleryItemProps) {
  const { t } = useTranslation([PROFILE]);

  const handleDragStart = (e: React.DragEvent) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    onDragStart(e, item.itemId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canEdit) return;
    onTouchStart(e, item.itemId);
  };

  return (
    <StyledImageListItem
      isDragging={isDragging}
      draggable={canEdit}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onTouchStart={handleTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      data-item-id={item.itemId}
    >
      <StyledImage
        src={item.thumbnailUrl || item.fullUrl}
        alt={item.caption || t("profile:gallery.photo")}
        loading="lazy"
      />

      {isDeleting && (
        <LoadingOverlay>
          <CircularProgress size={32} />
        </LoadingOverlay>
      )}

      {canEdit && (
        <DragHandle className="drag-handle">
          <DragIndicator fontSize="small" />
        </DragHandle>
      )}

      {isFirst && (
        <PrimaryBadge>
          <Star fontSize="small" sx={{ color: "common.white", fontSize: 14 }} />
          <Typography
            variant="caption"
            sx={{ color: "common.white", fontWeight: 600 }}
          >
            {t("profile:gallery.profile_photo")}
          </Typography>
        </PrimaryBadge>
      )}

      {canEdit && (
        <StyledImageListItemBar
          position="bottom"
          actionIcon={
            <Tooltip title={t("profile:gallery.remove_photo")}>
              <DeleteButton
                size="small"
                onClick={() => onDelete(item.itemId)}
                disabled={isDeleting}
                aria-label={t("profile:gallery.remove_photo")}
              >
                <Close fontSize="small" />
              </DeleteButton>
            </Tooltip>
          }
          actionPosition="right"
          title={item.caption || ""}
        />
      )}
    </StyledImageListItem>
  );
}
