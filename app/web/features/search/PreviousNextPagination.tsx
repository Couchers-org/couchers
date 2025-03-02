import { Button, Stack, Typography } from "@mui/material";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import React from "react";
import { useTranslation } from "react-i18next";
import { theme } from "theme";

interface PreviousNextPaginationProps {
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  hasUsers: boolean;
  meetsSearchCriteria: boolean;
  totalItems: number | undefined;
  onPreviousClick: () => void;
  onNextClick: () => void;
}

const PreviousNextPagination: React.FC<PreviousNextPaginationProps> = ({
  hasPreviousPage,
  hasNextPage,
  hasUsers,
  meetsSearchCriteria,
  totalItems,
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
        marginTop: theme.spacing(2),
        width: "100%",
      }}
    >
      <Button
        aria-label={t("global:previous")}
        onClick={onPreviousClick}
        disabled={!hasPreviousPage}
      >
        {t("global:previous")}
      </Button>

      <Typography variant="caption">
        {!meetsSearchCriteria
          ? null
          : !hasUsers
            ? t("search:search_result.no_user_result_message")
            : t("search:search_result.users_found_message", {
                totalItems,
              })}
      </Typography>

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
