import { Box, ImageList, ImageListItem, styled, Typography } from "@mui/material";
import CircularProgress from "components/CircularProgress";
import FlagButton from "features/FlagButton";
import { useGallery } from "features/profile/hooks/useGallery";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useState } from "react";

import PhotoLightbox from "./PhotoLightbox";

interface ProfilePhotoGalleryProps {
  galleryId: number;
}

const GalleryContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const StyledImageList = styled(ImageList)(({ theme }) => ({
  width: "100%",
  margin: 0,
  // Override default MUI ImageList margins
  marginTop: "0 !important",
}));

const StyledImageListItem = styled(ImageListItem)(({ theme }) => ({
  cursor: "pointer",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  transition: "box-shadow 0.2s ease",
  border: `1px solid var(--mui-palette-grey-300)`,
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(3),
}));

const ThumbnailContainer = styled(Box)({
  position: "relative",
  width: "100%",
  height: "100%",
});

const FlagButtonWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(0.5),
  right: theme.spacing(0.5),
  "& svg": {
    fontSize: 16,
  },
}));

export default function ProfilePhotoGallery({ galleryId }: ProfilePhotoGalleryProps) {
  const { t } = useTranslation([PROFILE]);
  const { data: gallery, isLoading } = useGallery(galleryId);
  const profileUser = useProfileUser();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (!gallery || !gallery.photosList || gallery.photosList.length === 0) {
    return null;
  }

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <GalleryContainer>
      <Typography variant="h1" sx={{ mb: 2 }}>
        {t("profile:heading.photos_section")}
      </Typography>

      <StyledImageList
        cols={4}
        rowHeight={200}
        gap={16}
        sx={{
          gridTemplateColumns: {
            xs: "repeat(2, 1fr) !important", // 2 columns on mobile
            sm: "repeat(3, 1fr) !important", // 3 columns on tablet
            md: "repeat(4, 1fr) !important", // 4 columns on desktop
          },
        }}
      >
        {gallery.photosList.map((photo, index) => (
          <StyledImageListItem
            key={photo.itemId}
            onClick={() => handlePhotoClick(index)}
            role="button"
            tabIndex={0}
            aria-label={
              photo.caption || `${t("profile:gallery.photo_item_a11y")} ${index + 1} of ${gallery.photosList.length}`
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePhotoClick(index);
              }
            }}
          >
            <ThumbnailContainer>
              <img src={photo.thumbnailUrl || photo.fullUrl} alt={photo.caption || ""} loading="lazy" />
              <FlagButtonWrapper
                onClick={(e) => {
                  e.stopPropagation();
                }}
                aria-label={t("profile:gallery.report_photo")}
              >
                <FlagButton contentRef={`photo/${photo.itemId}`} authorUser={profileUser.userId} />
              </FlagButtonWrapper>
            </ThumbnailContainer>
          </StyledImageListItem>
        ))}
      </StyledImageList>

      <PhotoLightbox
        photos={gallery.photosList.map((photo) => ({
          fullUrl: photo.fullUrl,
          thumbnailUrl: photo.thumbnailUrl,
          caption: photo.caption,
          itemId: photo.itemId,
        }))}
        initialIndex={selectedPhotoIndex}
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        galleryOwnerId={profileUser.userId}
      />
    </GalleryContainer>
  );
}
