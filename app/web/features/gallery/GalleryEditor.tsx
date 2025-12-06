import { Delete, DragIndicator, Edit } from "@mui/icons-material";
import {
  Box,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ImageInput from "components/ImageInput";
import Snackbar from "components/Snackbar";
import {
  useAddPhotoToGallery,
  useGallery,
  useGalleryEditInfo,
  useMovePhoto,
  useRemovePhotoFromGallery,
  useUpdatePhotoCaption,
} from "features/gallery/hooks";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { ImageInputValues } from "service/api";

const GalleryContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const GalleryHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(3),
}));

const PhotoGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const PhotoCard = styled(Card)(({ theme }) => ({
  position: "relative",
  borderRadius: theme.spacing(1),
  overflow: "hidden",
  cursor: "grab",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
  "&:active": {
    cursor: "grabbing",
  },
}));

const PhotoImage = styled("img")({
  width: "100%",
  height: 200,
  objectFit: "cover",
  display: "block",
});

const PhotoOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background:
    "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)",
  opacity: 0,
  transition: "opacity 0.2s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(1),
  "&:hover": {
    opacity: 1,
  },
}));

const PhotoActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(0.5),
  justifyContent: "flex-end",
}));

const DragHandle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.palette.common.white,
}));

const CaptionText = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: "0.875rem",
  padding: theme.spacing(1),
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
}));

const UploadCard = styled(Card)(({ theme }) => ({
  height: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px dashed ${theme.palette.grey[300]}`,
  backgroundColor: theme.palette.grey[50],
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + "10",
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  color: theme.palette.text.primary,
  "&:hover": {
    backgroundColor: theme.palette.common.white,
  },
}));

interface GalleryEditorProps {
  galleryId: number;
}

export default function GalleryEditor({ galleryId }: GalleryEditorProps) {
  const { t } = useTranslation([GLOBAL]);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<{
    itemId: number;
    caption: string;
  } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { control } = useForm();

  // Fetch gallery data
  const { data: gallery, isLoading, error } = useGallery(galleryId);

  // Fetch edit info (only when user can edit)
  const { data: editInfo } = useGalleryEditInfo(galleryId, gallery?.canEdit);

  // Mutations
  const addPhotoMutation = useAddPhotoToGallery(galleryId);
  const removePhotoMutation = useRemovePhotoFromGallery(galleryId);
  const updateCaptionMutation = useUpdatePhotoCaption(galleryId);
  const movePhotoMutation = useMovePhoto(galleryId);

  const handlePhotoUpload = async (data: ImageInputValues) => {
    await addPhotoMutation.mutateAsync({ uploadKey: data.key });
    setSuccessMessage(t("global:success.photo_added"));
    setShowSuccessToast(true);
  };

  const handleRemovePhoto = async (itemId: number) => {
    if (confirm(t("global:confirmation.delete_photo"))) {
      await removePhotoMutation.mutateAsync(itemId);
      setSuccessMessage(t("global:success.photo_removed"));
      setShowSuccessToast(true);
    }
  };

  const handleDragStart = (itemId: number) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetItemId: number) => {
    if (!draggedItemId || !gallery || draggedItemId === targetItemId) return;

    const photos = gallery.photosList;
    const targetIndex = photos.findIndex((p) => p.itemId === targetItemId);

    if (targetIndex === -1) return;

    // Calculate afterItemId: place the dragged item after the target item
    // (user drops onto a photo, so we place it right after that photo)
    const afterItemId = targetItemId;

    await movePhotoMutation.mutateAsync({ itemId: draggedItemId, afterItemId });
    setDraggedItemId(null);
    setSuccessMessage(t("global:success.photos_reordered"));
    setShowSuccessToast(true);
  };

  const handleUpdateCaption = async () => {
    if (!editingCaption) return;
    await updateCaptionMutation.mutateAsync(editingCaption);
    setEditingCaption(null);
    setSuccessMessage(t("global:success.caption_updated"));
    setShowSuccessToast(true);
  };

  if (isLoading) return <CenteredSpinner />;

  if (error) {
    return (
      <Alert severity="error">{t("global:error.failed_to_load_gallery")}</Alert>
    );
  }

  if (!gallery) {
    return (
      <Alert severity="error">{t("global:error.gallery_not_found")}</Alert>
    );
  }

  const maxPhotos = editInfo?.maxPhotos;
  const canAddMore =
    maxPhotos !== undefined && gallery.photosList.length < maxPhotos;
  const hasPhotos = gallery.photosList.length > 0;

  return (
    <GalleryContainer>
      <GalleryHeader>
        <Typography variant="h4">
          {t("global:gallery.manage_photos")}{" "}
          {maxPhotos !== undefined &&
            `(${gallery.photosList.length}/${maxPhotos})`}
        </Typography>
      </GalleryHeader>

      {!gallery.canEdit && (
        <Alert severity="warning">
          {t("global:error.cannot_edit_gallery")}
        </Alert>
      )}

      {gallery.canEdit && (
        <>
          {addPhotoMutation.isError && (
            <Alert severity="error">
              {t("global:error.failed_to_add_photo")}
            </Alert>
          )}
          {removePhotoMutation.isError && (
            <Alert severity="error">
              {t("global:error.failed_to_remove_photo")}
            </Alert>
          )}
          {updateCaptionMutation.isError && (
            <Alert severity="error">
              {t("global:error.failed_to_update_caption")}
            </Alert>
          )}

          <PhotoGrid container spacing={2}>
            {gallery.photosList.map((photo) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.itemId}>
                <PhotoCard
                  draggable
                  onDragStart={() => handleDragStart(photo.itemId)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(photo.itemId)}
                >
                  <PhotoImage
                    src={photo.thumbnailUrl}
                    alt={photo.caption || "Gallery photo"}
                  />
                  <PhotoOverlay>
                    <DragHandle>
                      <DragIndicator />
                    </DragHandle>
                    <Box>
                      {photo.caption && (
                        <CaptionText>{photo.caption}</CaptionText>
                      )}
                      <PhotoActions>
                        <ActionButton
                          size="small"
                          onClick={() =>
                            setEditingCaption({
                              itemId: photo.itemId,
                              caption: photo.caption || "",
                            })
                          }
                          aria-label="Edit caption"
                        >
                          <Edit fontSize="small" />
                        </ActionButton>
                        <ActionButton
                          size="small"
                          onClick={() => handleRemovePhoto(photo.itemId)}
                          aria-label="Delete photo"
                        >
                          <Delete fontSize="small" />
                        </ActionButton>
                      </PhotoActions>
                    </Box>
                  </PhotoOverlay>
                </PhotoCard>
              </Grid>
            ))}

            {canAddMore && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <UploadCard>
                  <ImageInput
                    control={control}
                    id="gallery-upload"
                    name="upload"
                    type="rect"
                    alt={t("global:gallery.upload_photo_alt")}
                    onSuccess={handlePhotoUpload}
                  />
                </UploadCard>
              </Grid>
            )}
          </PhotoGrid>

          {!hasPhotos && !canAddMore && (
            <Alert severity="info">{t("global:gallery.no_photos")}</Alert>
          )}
        </>
      )}

      {/* Edit Caption Dialog */}
      <Dialog
        open={!!editingCaption}
        onClose={() => setEditingCaption(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("global:gallery.edit_caption")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label={t("global:gallery.caption")}
            value={editingCaption?.caption || ""}
            onChange={(e) =>
              setEditingCaption(
                editingCaption
                  ? { ...editingCaption, caption: e.target.value }
                  : null,
              )
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingCaption(null)}>
            {t("global:cancel")}
          </Button>
          <Button
            onClick={handleUpdateCaption}
            variant="contained"
            loading={updateCaptionMutation.isPending}
          >
            {t("global:save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Toast */}
      {showSuccessToast && (
        <Snackbar severity="success" onClose={() => setShowSuccessToast(false)}>
          {successMessage}
        </Snackbar>
      )}
    </GalleryContainer>
  );
}
