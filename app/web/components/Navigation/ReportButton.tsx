import { darken, styled, SxProps, Theme, Typography } from "@mui/material";
import Button from "components/Button";
import { BugIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { useState } from "react";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

import ReportDialog from "./ReportDialog";

const StyledReportButton = styled(Button)(({ theme }) => ({
  flexShrink: 0,
  backgroundColor: theme.palette.error.main,
  "&:hover": {
    backgroundColor: darken(theme.palette.error.main, 0.1),
  },
  [theme.breakpoints.down("md")]: {
    padding: `6px ${theme.spacing(1)}`,
    minWidth: "auto",
  },
  "& .MuiButton-startIcon": {
    [theme.breakpoints.down("md")]: {
      margin: 0,
    },
  },
}));

export default function ReportButton({
  isResponsive = true,
  isMenuLink,
  sx,
}: {
  isResponsive?: boolean;
  isMenuLink?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { t } = useTranslation("global");
  const isMobile = useIsScreenSizeOrSmaller("mobile");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      {isMenuLink ? (
        <Typography
          aria-label={t("report.label")}
          onClick={() => setIsDialogOpen(true)}
          sx={{
            color: "var(--mui-palette-text-secondary)",
            cursor: "pointer",

            "&:hover": {
              textDecoration: "underline",
            },
            ...sx,
          }}
        >
          {t("report.label")}
        </Typography>
      ) : (
        <StyledReportButton
          aria-label={t("report.label")}
          onClick={() => setIsDialogOpen(true)}
          startIcon={<BugIcon />}
          variant="contained"
          color="primary"
          sx={{ ...sx }}
        >
          {(!isResponsive || !isMobile) && t("report.label")}
        </StyledReportButton>
      )}
      <ReportDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
