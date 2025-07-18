import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, Stack, styled } from "@mui/material";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import React from "react";
import { useTranslation } from "react-i18next";
import { theme } from "theme";

const StyledPaginationButton = styled(Button)(({ theme }) => ({
  minWidth: "120px",
  height: "35px",
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 500,
  fontSize: "1rem",
  backgroundColor: theme.palette.common.white,
  border: `1px solid ${theme.palette.grey[300]}`,
  color: theme.palette.text.primary,
  transition: "all 0.2s ease-in-out",

  "&:hover": {
    backgroundColor: theme.palette.grey[50],
    borderColor: theme.palette.grey[400],
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },

  "&:active": {
    transform: "translateY(0)",
  },

  "&.Mui-disabled": {
    opacity: 0.4,
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.grey[200],
    color: theme.palette.common.black,
  },
}));

interface PreviousNextPaginationProps {
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  onPreviousClick: () => void;
  onNextClick: () => void;
}

const PreviousNextPagination: React.FC<PreviousNextPaginationProps> = ({
  hasPreviousPage,
  hasNextPage,
  onPreviousClick,
  onNextClick,
}) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  return (
    <Stack
      direction="row"
      spacing={3}
      alignItems="center"
      justifyContent="space-between"
      sx={{
        width: "100%",
        height: "50px",
        position: "sticky",
        bottom: 0,
        backgroundColor: theme.palette.common.white,
        padding: theme.spacing(0, 2),
        borderTop: `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      <StyledPaginationButton
        aria-label={t("global:previous")}
        onClick={onPreviousClick}
        disabled={!hasPreviousPage}
        startIcon={<ChevronLeftIcon />}
      >
        {t("global:previous")}
      </StyledPaginationButton>
      <StyledPaginationButton
        aria-label={t("global:next")}
        onClick={onNextClick}
        disabled={!hasNextPage}
        endIcon={<ChevronRightIcon />}
        sx={{
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
            borderColor: theme.palette.primary.dark,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
          "&.Mui-disabled": {
            backgroundColor: theme.palette.grey[300],
            borderColor: theme.palette.grey[300],
            color: theme.palette.grey[500],
          },
        }}
      >
        {t("global:next")}
      </StyledPaginationButton>
    </Stack>
  );
};

export default PreviousNextPagination;
