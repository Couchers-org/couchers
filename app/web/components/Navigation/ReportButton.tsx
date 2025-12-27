import { darken, styled, Typography, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { BugIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { useState } from "react";
import { theme } from "theme";

import ReportDialog from "./ReportDialog";

const StyledReportButton = styled(Button)(({ theme }) => ({
  flexShrink: 0,
  backgroundColor: theme.palette.error.main,
  "&:hover": {
    backgroundColor: darken(theme.palette.error.main, 0.1),
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
}: {
  isResponsive?: boolean;
  isMenuLink?: boolean;
}) {
  const { t } = useTranslation("global");
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));
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
        >
          {(!isResponsive || !isBelowMd) && t("report.label")}
        </StyledReportButton>
      )}
      <ReportDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
