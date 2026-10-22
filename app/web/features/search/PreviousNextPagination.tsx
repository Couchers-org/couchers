import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, Stack, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import React from "react";
import { theme } from "theme";

interface PreviousNextPaginationProps {
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  onPreviousClick: () => void;
  onNextClick: () => void;
}

const StyledPaginationButton = styled(Button)(() => ({
  minWidth: "110px",
  height: "35px",
  fontSize: "1rem",
}));

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
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "50px",
        position: "sticky",
        bottom: 0,
        backgroundColor: "var(--mui-palette-background-paper)",
        padding: theme.spacing(0, 2),
        borderTop: `1px solid var(--mui-palette-grey-200)`,
      }}
    >
      <StyledPaginationButton
        aria-label={t("global:previous")}
        onClick={onPreviousClick}
        disabled={!hasPreviousPage}
        startIcon={<ChevronLeftIcon />}
        variant="contained"
      >
        {t("global:previous")}
      </StyledPaginationButton>
      <StyledPaginationButton
        aria-label={t("global:next")}
        onClick={onNextClick}
        disabled={!hasNextPage}
        endIcon={<ChevronRightIcon />}
        variant="contained"
      >
        {t("global:next")}
      </StyledPaginationButton>
    </Stack>
  );
};

export default PreviousNextPagination;
