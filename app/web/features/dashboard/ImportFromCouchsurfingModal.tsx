import { InfoOutlined, UploadFile } from "@mui/icons-material";
import { Box, CircularProgress, styled, Typography } from "@mui/material";
import Button from "components/Button";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import React, { ChangeEvent, DragEvent, useRef, useState } from "react";

interface ImportFromCouchsurfingModalProps {
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

const StepContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const StepNumber = styled(Box)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: "0.875rem",
  flexShrink: 0,
}));

const StepContent = styled(Box)(() => ({
  flex: 1,
}));

const StepTitle = styled(Typography)({
  fontWeight: 600,
});

const StepDescription = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  marginBottom: theme.spacing(1),
}));

const DropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragOver" && prop !== "hasFile",
})<{ isDragOver: boolean; hasFile: boolean }>(
  ({ theme, isDragOver, hasFile }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(3),
    backgroundColor: isDragOver
      ? theme.palette.action.hover
      : hasFile
        ? theme.palette.success.main + "20"
        : theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius * 2,
    border: `2px dashed ${
      isDragOver
        ? theme.palette.primary.main
        : hasFile
          ? theme.palette.success.main
          : theme.palette.divider
    }`,
    transition: "all 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
      borderColor: theme.palette.primary.main,
    },
  }),
);

const DropZoneIcon = styled(UploadFile)(({ theme }) => ({
  fontSize: 40,
  marginBottom: theme.spacing(1),
}));

const FileNameText = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginTop: theme.spacing(1),
}));

const InfoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
}));

const InfoIcon = styled(InfoOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 20,
  flexShrink: 0,
  marginTop: 2,
}));

const InfoContent = styled(Box)(() => ({
  flex: 1,
}));

const InfoTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "0.875rem",
  marginBottom: theme.spacing(0.5),
}));

const InfoDescription = styled(Typography)({
  fontSize: "0.875rem",
});

const HiddenInput = styled("input")({
  display: "none",
});

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  zIndex: 10,
  gap: theme.spacing(2),
}));

const ButtonRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  alignItems: "center",
  flexWrap: "wrap",
}));

export default function ImportFromCouchsurfingModal({
  open,
  onClose,
  onFileSelected,
  isLoading,
}: ImportFromCouchsurfingModalProps) {
  const { t } = useTranslation([DASHBOARD]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsDragOver(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="import-cs-dialog-title"
      >
        <DialogTitle id="import-cs-dialog-title" onClose={handleClose}>
          {t("dashboard:couchsurfingcom_import.dialog_title")}
        </DialogTitle>
        <DialogContent sx={{ position: "relative" }}>
          {isLoading && (
            <LoadingOverlay>
              <CircularProgress size={48} />
              <Typography>
                {t("dashboard:couchsurfingcom_import.importing")}
              </Typography>
            </LoadingOverlay>
          )}
          <DialogContentText sx={{ paddingX: 0 }}>
            {t("dashboard:couchsurfingcom_import.intro_text")}
          </DialogContentText>

          {/* Step 1 */}
          <StepContainer>
            <StepNumber>1</StepNumber>
            <StepContent>
              <StepTitle>
                {t("dashboard:couchsurfingcom_import.step1_title")}
              </StepTitle>
              <StepDescription>
                {t("dashboard:couchsurfingcom_import.step1_description")}
              </StepDescription>
              <Button
                variant="outlined"
                size="small"
                component="a"
                href="https://www.couchsurfing.com/preferences/account"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("dashboard:couchsurfingcom_import.open_couchsurfing_link")}
              </Button>
            </StepContent>
          </StepContainer>

          {/* Step 2 */}
          <StepContainer>
            <StepNumber>2</StepNumber>
            <StepContent>
              <StepTitle>
                {t("dashboard:couchsurfingcom_import.step2_title")}
              </StepTitle>
              <StepDescription>
                {t("dashboard:couchsurfingcom_import.step2_description")}
              </StepDescription>
            </StepContent>
          </StepContainer>

          {/* Step 3 */}
          <StepContainer>
            <StepNumber>3</StepNumber>
            <StepContent>
              <StepTitle>
                {t("dashboard:couchsurfingcom_import.step3_title")}
              </StepTitle>
              <StepDescription>
                {t("dashboard:couchsurfingcom_import.step3_description")}
              </StepDescription>
              <DropZone
                isDragOver={isDragOver}
                hasFile={!!selectedFile}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleSelectFile}
              >
                <DropZoneIcon />
                <ButtonRow>
                  <Typography variant="body2">
                    {t("dashboard:couchsurfingcom_import.drop_file_caption")}
                  </Typography>
                  <Typography variant="body2" sx={{ mx: 1 }}>
                    {t("dashboard:couchsurfingcom_import.or_text")}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSelectFile();
                    }}
                    loading={isLoading}
                  >
                    {t("dashboard:couchsurfingcom_import.choose_file_button")}
                  </Button>
                </ButtonRow>
                <FileNameText>
                  {selectedFile
                    ? selectedFile.name
                    : t(
                        "dashboard:couchsurfingcom_import.no_file_selected_placeholder",
                      )}
                </FileNameText>
              </DropZone>
            </StepContent>
          </StepContainer>

          {/* Info box */}
          <InfoBox>
            <InfoIcon />
            <InfoContent>
              <InfoTitle>
                {t("dashboard:couchsurfingcom_import.info_title")}
              </InfoTitle>
              <InfoDescription>
                {t("dashboard:couchsurfingcom_import.info_description")}
              </InfoDescription>
            </InfoContent>
          </InfoBox>
        </DialogContent>
      </Dialog>
      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept=".zip,.json"
        onChange={handleFileChange}
      />
    </>
  );
}
