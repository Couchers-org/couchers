import { alpha, Box, LinearProgress, Skeleton, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { DONATIONS } from "i18n/namespaces";

import useDonationStats from "./useDonationStats";

const ProgressWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
  borderRadius: theme.shape.borderRadius * 2,
}));

const ThermometerRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  width: "100%",
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 16,
  borderRadius: 8,
  flexGrow: 1,
  backgroundColor: alpha(theme.palette.secondary.main, 0.15),
  "& .MuiLinearProgress-bar": {
    borderRadius: 8,
    background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
  },
}));

const ProgressLabel = styled("span")(({ theme }) => ({
  fontSize: "1rem",
  fontWeight: 600,
  color: theme.palette.secondary.main,
  whiteSpace: "nowrap",
}));

const ProgressTitle = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const ProgressSubtitle = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  color: theme.palette.text.secondary,
}));

export default function DonationProgress() {
  const { t } = useTranslation(DONATIONS);
  const { data: donationStats, isLoading } = useDonationStats();

  if (isLoading) {
    return (
      <ProgressWrapper>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton
          variant="rectangular"
          height={16}
          sx={{ borderRadius: "8px" }}
        />
        <Skeleton variant="text" width="40%" height={18} />
      </ProgressWrapper>
    );
  }

  if (!donationStats) {
    return null;
  }

  const progress = Math.min(
    (donationStats.totalDonatedYtd / donationStats.goal) * 100,
    100,
  );

  const formattedRaised = donationStats.totalDonatedYtd.toLocaleString();
  const formattedGoal = donationStats.goal.toLocaleString();

  return (
    <ProgressWrapper>
      <ProgressTitle>{t("donation_progress.title")}</ProgressTitle>
      <ThermometerRow>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <StyledLinearProgress
            variant="determinate"
            value={progress}
            aria-label={t("donation_progress.aria_label")}
          />
        </Box>
        <ProgressLabel>
          ${formattedRaised} / ${formattedGoal}
        </ProgressLabel>
      </ThermometerRow>
      <ProgressSubtitle>
        {t("donation_progress.subtitle", {
          percent: Math.round(progress),
        })}
      </ProgressSubtitle>
    </ProgressWrapper>
  );
}
