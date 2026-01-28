import { ArrowBackIos, ArrowForwardIos, Close } from "@mui/icons-material";
import { Box, IconButton, Modal, styled, Typography } from "@mui/material";
import { FlagIcon } from "components/Icons";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useCallback, useEffect, useState } from "react";

interface PhotoLightboxProps {
  photos: Array<{
    fullUrl: string;
    thumbnailUrl: string;
    caption?: string;
    itemId?: number;
  }>;
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  galleryOwnerId?: number;
}

const Backdrop = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.9)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1300,
});

const ContentContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(15), // Space for thumbnail strip
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(12),
  },
}));

const StyledImage = styled("img")({
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
});

const NavButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  color: theme.palette.common.white,
  width: 56,
  height: 56,
  border: "2px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  transition: "all 0.2s ease",
  zIndex: 10,
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    transform: "translateY(-50%) scale(1.1)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
    borderColor: theme.palette.primary.main,
  },
  "&:disabled": {
    opacity: 0.3,
    cursor: "not-allowed",
  },
  [theme.breakpoints.down("sm")]: {
    width: 48,
    height: 48,
  },
}));

const PrevButton = styled(NavButton)(({ theme }) => ({
  left: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    left: theme.spacing(1),
  },
}));

const NextButton = styled(NavButton)(({ theme }) => ({
  right: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    right: theme.spacing(1),
  },
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  color: theme.palette.common.white,
  width: 48,
  height: 48,
  border: "2px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  transition: "all 0.2s ease",
  zIndex: 10,
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    transform: "scale(1.1)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
    borderColor: theme.palette.primary.main,
  },
  [theme.breakpoints.down("sm")]: {
    width: 44,
    height: 44,
  },
}));

const PhotoCounter = styled(Typography)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  left: theme.spacing(2),
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  color: theme.palette.common.white,
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  fontSize: "1rem",
  fontWeight: 500,
  border: "2px solid rgba(255, 255, 255, 0.3)",
  zIndex: 10,
}));

const ThumbnailStrip = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  display: "flex",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  overflowX: "auto",
  justifyContent: "center",
  // Custom scrollbar styling
  "&::-webkit-scrollbar": {
    height: 6,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.5)",
    },
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
  },
}));

const ThumbnailImage = styled("img")<{ isActive: boolean }>(
  ({ theme, isActive }) => ({
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: theme.shape.borderRadius,
    cursor: "pointer",
    border: isActive
      ? `3px solid ${theme.palette.primary.main}`
      : "3px solid transparent",
    opacity: isActive ? 1 : 0.6,
    transition: "all 0.2s ease",
    flexShrink: 0,
    "&:hover": {
      opacity: 1,
      transform: "scale(1.05)",
    },
    [theme.breakpoints.down("sm")]: {
      width: 60,
      height: 60,
    },
  }),
);

const ReportButtonContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(16),
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 2),
  zIndex: 10,
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    transform: "translateX(-50%) scale(1.05)",
  },
  [theme.breakpoints.down("sm")]: {
    bottom: theme.spacing(14),
  },
}));

const ReportButtonLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginLeft: theme.spacing(0.5),
  fontSize: "0.875rem",
  fontWeight: 500,
}));

export default function PhotoLightbox(props: PhotoLightboxProps) {
  const { photos, initialIndex, open, onClose, galleryOwnerId } = props;
  const { t } = useTranslation([PROFILE]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrevious, handleNext, onClose]);

  if (!open) return null;

  const currentPhoto = photos[currentIndex];
  const showNavigation = photos.length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby={t("gallery.photo_viewer_aria")}
    >
      <Backdrop onClick={onClose}>
        <ContentContainer onClick={(e) => e.stopPropagation()}>
          <StyledImage
            src={currentPhoto.fullUrl}
            alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
            loading="eager"
          />
        </ContentContainer>

        {showNavigation && (
          <>
            <PrevButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              aria-label={t("gallery.previous_photo")}
            >
              <ArrowBackIos sx={{ ml: 1 }} />
            </PrevButton>

            <NextButton
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label={t("gallery.next_photo")}
            >
              <ArrowForwardIos />
            </NextButton>

            <PhotoCounter onClick={(e) => e.stopPropagation()}>
              {t("gallery.photo_count", {
                current: currentIndex + 1,
                total: photos.length,
              })}
            </PhotoCounter>

            <ThumbnailStrip onClick={(e) => e.stopPropagation()}>
              {photos.map((photo, index) => (
                <ThumbnailImage
                  key={index}
                  src={photo.thumbnailUrl || photo.fullUrl}
                  alt={photo.caption || `Photo ${index + 1}`}
                  isActive={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                  loading="lazy"
                />
              ))}
            </ThumbnailStrip>
          </>
        )}

        {galleryOwnerId && currentPhoto.itemId && (
          <FlagButton
            contentRef={`photo/${currentPhoto.itemId}`}
            authorUser={galleryOwnerId}
            renderButton={(onClick) => (
              <ReportButtonContainer
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(e);
                }}
                role="button"
                tabIndex={0}
                aria-label={t("gallery.report_photo")}
              >
                <FlagIcon color="primary" />
                <ReportButtonLabel>
                  {t("gallery.report_photo")}
                </ReportButtonLabel>
              </ReportButtonContainer>
            )}
          />
        )}

        <CloseButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={t("gallery.close_viewer")}
        >
          <Close />
        </CloseButton>
      </Backdrop>
    </Modal>
  );
}
