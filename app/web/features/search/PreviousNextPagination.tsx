import { Button, Stack } from "@mui/material";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import React from "react";
import { useTranslation } from "react-i18next";
import { theme } from "theme";

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
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
      sx={{
        width: "100%",
        position: "sticky",
        bottom: 0,
        backgroundColor: theme.palette.common.white,
        boxShadow: `0 -1px 4px rgba(0, 0, 0, 0.1)`,
      }}
    >
      <Button
        aria-label={t("global:previous")}
        onClick={onPreviousClick}
        disabled={!hasPreviousPage}
      >
        {t("global:previous")}
      </Button>
      <Button
        aria-label={t("global:next")}
        onClick={onNextClick}
        disabled={!hasNextPage}
      >
        {t("global:next")}
      </Button>
    </Stack>
  );
};

export default PreviousNextPagination;
