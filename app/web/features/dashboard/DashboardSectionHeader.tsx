import { ArrowBack, ArrowForward, SvgIconComponent } from "@mui/icons-material";
import { Box, IconButton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { ReactNode } from "react";

interface DashboardSectionHeaderProps {
  icon: SvgIconComponent;
  title: string;
  // shown as a badge next to the title when greater than zero
  count?: number;
  // extra content shown before the arrows, e.g. a "manage" link
  action?: ReactNode;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const Header = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  minHeight: 28,
}));

const Controls = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 4,
  // long translated titles must wrap rather than squash the arrows onto two lines
  flexShrink: 0,
});

export default function DashboardSectionHeader({
  icon: Icon,
  title,
  count,
  action,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: DashboardSectionHeaderProps) {
  const { t } = useTranslation([DASHBOARD]);

  return (
    <Header>
      <Typography variant="h2" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
        <Icon sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }} />
        {/* the badge flows inline so it stays after the last word when the title wraps */}
        <span>
          {title}
          {!!count && (
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--mui-palette-text-secondary)",
                background: "var(--mui-palette-grey-50)",
                borderRadius: 999,
                px: 1.125,
                ml: 1,
                lineHeight: "20px",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            >
              {count}
            </Box>
          )}
        </span>
      </Typography>
      <Controls>
        {action}
        <IconButton
          size="small"
          onClick={onPrevious}
          disabled={!hasPrevious}
          color={hasPrevious ? "primary" : "default"}
          aria-label={t("dashboard:prev_page_button_a11y")}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={onNext}
          disabled={!hasNext}
          color={hasNext ? "primary" : "default"}
          aria-label={t("dashboard:next_page_button_a11y")}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
      </Controls>
    </Header>
  );
}
