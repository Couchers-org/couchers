import { SvgIconComponent } from "@mui/icons-material";
import { Box, styled, Typography } from "@mui/material";
import { ReactNode } from "react";

interface FactProps {
  icon: SvgIconComponent;
  // shown above the value, for facts whose text alone doesn't say what it is (e.g. an occupation)
  label?: string;
  children: ReactNode;
  detail?: ReactNode;
  // takes both columns on phones
  wide?: boolean;
  // greyed out, for a "no" such as can't host
  muted?: boolean;
}

interface SummaryCardProps {
  icon: SvgIconComponent;
  value: ReactNode;
  caption: ReactNode;
}

export const FactGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(1.5, 2),
  marginTop: theme.spacing(1.5),
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
}));

export const FactList = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.25),
}));

// The theme's body2 (12px) and caption (10px) are too small for scanning facts, so these scale up from phone to desktop
const valueFontSize = { xs: "0.875rem", md: "1rem" };
const detailFontSize = { xs: "0.8125rem", md: "0.875rem" };

export const FactLabel = styled("div")(({ theme }) => ({
  ...theme.typography.caption,
  fontSize: "0.6875rem",
  [theme.breakpoints.up("md")]: {
    fontSize: "0.75rem",
  },
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--mui-palette-text-secondary)",
}));

const FactRoot = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(0.75),
  minWidth: 0,
}));

export function Fact({ icon: Icon, label, children, detail, wide, muted }: FactProps) {
  return (
    <FactRoot sx={wide ? { gridColumn: { xs: "span 2", md: "auto" } } : undefined}>
      <Icon
        aria-hidden
        sx={{
          fontSize: { xs: 18, md: 20 },
          mt: { xs: "1px", md: 0 },
          color: muted ? "var(--mui-palette-text-secondary)" : "var(--mui-palette-primary-main)",
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0, overflowWrap: "break-word", hyphens: "auto" }}>
        {label && <FactLabel>{label}</FactLabel>}
        <Typography
          component="div"
          sx={{
            fontSize: valueFontSize,
            fontWeight: 500,
            color: muted ? "var(--mui-palette-text-secondary)" : undefined,
          }}
        >
          {children}
        </Typography>
        {detail && (
          <Typography sx={{ fontSize: detailFontSize, color: "var(--mui-palette-text-secondary)" }}>
            {detail}
          </Typography>
        )}
      </Box>
    </FactRoot>
  );
}

export const SummaryCards = styled("div")(({ theme }) => ({
  display: "grid",
  // three across, dropping to two on very narrow phones so words don't break mid-word
  gridTemplateColumns: "repeat(auto-fit, minmax(5.5rem, 1fr))",
  gap: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    gap: theme.spacing(1.5),
  },
}));

const SummaryCardRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.5, 1.25),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 12,
  minWidth: 0,
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.75, 2),
  },
}));

export function SummaryCard({ icon: Icon, value, caption }: SummaryCardProps) {
  return (
    <SummaryCardRoot className="summary-card">
      <Icon aria-hidden sx={{ fontSize: 24, color: "var(--mui-palette-primary-main)" }} />
      <Box sx={{ minWidth: 0, overflowWrap: "break-word", hyphens: "auto" }}>
        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
          {value}
        </Typography>
        <Typography component="div" sx={{ fontSize: detailFontSize, color: "var(--mui-palette-text-secondary)" }}>
          {caption}
        </Typography>
      </Box>
    </SummaryCardRoot>
  );
}
