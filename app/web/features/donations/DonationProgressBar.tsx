import { alpha, Box, LinearProgress, Skeleton, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";

import useDonationStats from "./useDonationStats";

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 14,
  borderRadius: 7,
  flexGrow: 1,
  backgroundColor: alpha(theme.palette.secondary.main, 0.15),
  "& .MuiLinearProgress-bar": {
    borderRadius: 7,
    background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
  },
}));

const ProgressRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  width: "100%",
}));

const ProgressLabel = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 600,
  color: theme.palette.secondary.main,
  whiteSpace: "nowrap",
}));

export default function DonationProgressBar() {
  const { t, i18n } = useTranslation(GLOBAL);
  const { data: donationStats, isLoading } = useDonationStats();

  if (isLoading) {
    return (
      <ProgressRow>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Skeleton variant="rounded" height={14} sx={{ borderRadius: "7px" }} />
        </Box>
        <Skeleton variant="text" width={100} />
      </ProgressRow>
    );
  }

  if (!donationStats) {
    return null;
  }

  const progress = Math.min((donationStats.totalDonatedYtd / donationStats.goal) * 100, 100);

  const currencyFormatter = new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formattedRaised = currencyFormatter.format(donationStats.totalDonatedYtd);
  const formattedGoal = currencyFormatter.format(donationStats.goal);

  return (
    <ProgressRow>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <StyledLinearProgress variant="determinate" value={progress} aria-label={t("donation_banner.progress_label")} />
      </Box>
      <ProgressLabel>
        {formattedRaised} / {formattedGoal}
      </ProgressLabel>
    </ProgressRow>
  );
}
