/**
 * BetaFlag - A reusable badge component to highlight beta features
 *
 * Usage:
 * ```tsx
 * <BetaFlag />
 * ```
 *
 * Typically placed next to a label or feature name to draw attention to new and experimental features.
 */
import { Chip } from "@mui/material";
import { styled } from "@mui/system";

import { useTranslation } from "../i18n";
import { GLOBAL } from "../i18n/namespaces";

const StyledChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: "0.625rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginLeft: theme.spacing(1),
  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
  color: theme.palette.common.white,
}));

export default function BetaFlag() {
  const { t } = useTranslation(GLOBAL);
  return <StyledChip label={`✨ ${t("beta")}`} size="small" />;
}
