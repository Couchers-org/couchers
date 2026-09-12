import { alpha, Box, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { ReactNode } from "react";

export type VerificationStatus = "verified" | "in_progress" | "code_sent" | "not_verified";

export type IconTint = "primary" | "primaryDark" | "secondary";

const TINT_COLOR: Record<IconTint, string> = {
  primary: "var(--mui-palette-primary-main)",
  primaryDark: "var(--mui-palette-primary-dark)",
  secondary: "var(--mui-palette-secondary-main)",
};

/** The section as a whole: heading block, then one block per flow state. */
export const SectionRoot = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
}));

/** A vertical run of related copy and controls inside a section. */
export const SectionBlock = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.75),
}));

/** Buttons plus any trailing hint text, wrapping on narrow screens. */
export const ActionRow = styled("div", { shouldForwardProp: (prop) => prop !== "align" })<{
  align?: "start" | "center";
}>(({ theme, align = "start" }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  alignItems: "center",
  justifyContent: align === "center" ? "center" : "flex-start",
  // Once the row wraps there is no useful left edge to align to, so centre.
  [theme.breakpoints.down("sm")]: {
    justifyContent: "center",
    textAlign: "center",
  },
}));

const IconTile = styled("span")({
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  "& .MuiSvgIcon-root": { fontSize: 24 },
});

const Pill = styled("span")(({ theme }) => ({
  marginInlineStart: "auto",
  display: "inline-flex",
  alignItems: "center",
  padding: theme.spacing(0.375, 1.25),
  borderRadius: 24,
  fontSize: "0.6875rem", // 11px, below the theme's smallest step
  fontWeight: 700,
  whiteSpace: "nowrap",
}));

function StatusPill({ status }: { status: VerificationStatus }) {
  const { t } = useTranslation(AUTH);

  const labels: Record<VerificationStatus, string> = {
    verified: t("verification_page.status_pill.verified"),
    in_progress: t("verification_page.status_pill.in_progress"),
    code_sent: t("verification_page.status_pill.code_sent"),
    not_verified: t("verification_page.status_pill.not_verified"),
  };

  return (
    <Pill
      sx={(theme) => {
        // alpha() needs a real colour rather than a CSS variable, so the tint is
        // computed off the light scheme; at 14% it reads as a wash in both. The
        // text colour does have to flip, or the dark green/orange goes muddy.
        if (status === "verified") {
          return {
            backgroundColor: alpha(theme.palette.success.main, 0.14),
            color: theme.palette.success.dark,
            ...theme.applyStyles("dark", { color: theme.palette.success.light }),
          };
        }
        if (status === "in_progress" || status === "code_sent") {
          return {
            backgroundColor: alpha(theme.palette.secondary.main, 0.14),
            color: theme.palette.secondary.dark,
            ...theme.applyStyles("dark", { color: theme.palette.secondary.light }),
          };
        }
        return {
          backgroundColor: "var(--mui-palette-grey-200)",
          color: "var(--mui-palette-text-secondary)",
        };
      }}
    >
      {labels[status]}
    </Pill>
  );
}

type VerificationSectionHeaderProps = {
  icon: ReactNode;
  iconTint: IconTint;
  title: string;
  description: string;
  status: VerificationStatus;
};

export function VerificationSectionHeader({
  icon,
  iconTint,
  title,
  description,
  status,
}: VerificationSectionHeaderProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <IconTile
          sx={(theme) => ({
            color: TINT_COLOR[iconTint],
            backgroundColor: alpha(
              iconTint === "secondary" ? theme.palette.secondary.main : theme.palette.primary.main,
              0.12,
            ),
          })}
        >
          {icon}
        </IconTile>
        <Typography variant="h2">{title}</Typography>
        <StatusPill status={status} />
      </Box>
      <Typography variant="body1" sx={{ color: "var(--mui-palette-text-secondary)", textWrap: "pretty" }}>
        {description}
      </Typography>
    </Box>
  );
}

/** The green "you're done" banner each section ends on. */
export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        padding: theme.spacing(1.75, 2),
        borderRadius: "8px",
        backgroundColor: alpha(theme.palette.success.main, 0.08),
        "& .MuiSvgIcon-root": { fontSize: 22, color: "var(--mui-palette-success-main)" },
      })}
    >
      {children}
    </Box>
  );
}

/** A neutral, grey-tinted note row (postcard in transit, data handling, ...). */
export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        padding: theme.spacing(1.75, 2),
        borderRadius: "8px",
        backgroundColor: "var(--mui-palette-grey-50)",
        "& .MuiSvgIcon-root": { fontSize: 22, color: "var(--mui-palette-primary-main)" },
      })}
    >
      {children}
    </Box>
  );
}
