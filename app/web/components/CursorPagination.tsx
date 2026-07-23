import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, Stack } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";

interface CursorPaginationProps {
  hasPreviousPage: boolean;
  hasNextPage: boolean | undefined;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

export default function CursorPagination({
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
  isLoading = false,
}: CursorPaginationProps) {
  const { t } = useTranslation([GLOBAL]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 2,
      }}
    >
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          startIcon={<ChevronLeftIcon />}
          onClick={onPrevious}
          disabled={!hasPreviousPage || isLoading}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outlined"
          endIcon={<ChevronRightIcon />}
          onClick={onNext}
          disabled={!hasNextPage || isLoading}
        >
          {t("next")}
        </Button>
      </Stack>
    </Box>
  );
}
