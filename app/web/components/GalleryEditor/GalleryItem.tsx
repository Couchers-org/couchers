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
  isDragOver: boolean;
  isDeleting: boolean;
  canEdit: boolean;
  onDelete: (itemId: number) => void;
  onDragStart: (e: React.DragEvent, itemId: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, targetItemId: number) => void;
  onDrop: (e: React.DragEvent, targetItemId: number) => void;
  onTouchStart: (e: React.TouchEvent, itemId: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const StyledImageListItem = styled(ImageListItem, {
  shouldForwardProp: (prop) => prop !== "isDragging" && prop !== "isDragOver",
})<{ isDragging: boolean; isDragOver: boolean }>(
  ({ theme, isDragging, isDragOver }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    cursor: "grab",
    opacity: isDragging ? 0.5 : 1,
    transition: "opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: isDragOver ? theme.shadows[8] : undefined,
    transform: isDragOver ? "scale(1.02)" : undefined,
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: isDragOver
        ? `4px solid ${theme.palette.primary.main}`
        : "4px solid transparent",
      borderRadius: theme.shape.borderRadius,
      pointerEvents: "none",
      transition: "border-color 0.2s ease",
      zIndex: 2,
    },
    "&:hover": {
      boxShadow: theme.shadows[4],
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
  }),
);

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

export default function GalleryItem({
  item,
  isFirst,
  isDragging,
  isDragOver,
  isDeleting,
  canEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
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

  const handleDragOver = (e: React.DragEvent) => {
    onDragOver(e, item.itemId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canEdit) return;
    onTouchStart(e, item.itemId);
  };

  return (
    <StyledImageListItem
      isDragging={isDragging}
      isDragOver={isDragOver}
      draggable={canEdit}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={(e) => onDrop(e, item.itemId)}
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
            {t("profile:gallery.primary")}
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
