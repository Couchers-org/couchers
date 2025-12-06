import { alpha, Box, LinearProgress, Skeleton, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

const ThermometerRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  width: "100%",
}));

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

const ProgressLabel = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 600,
  color: theme.palette.secondary.main,
  whiteSpace: "nowrap",
}));

interface DonationProgressBarProps {
  totalDonatedYtd: number;
  goal: number;
  isLoading?: boolean;
}

export function DonationProgressBar({
  totalDonatedYtd,
  goal,
  isLoading,
}: DonationProgressBarProps) {
  const { t } = useTranslation(GLOBAL);

  if (isLoading) {
    return (
      <ThermometerRow>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Skeleton
            variant="rounded"
            height={14}
            sx={{ borderRadius: "7px" }}
          />
        </Box>
        <Skeleton variant="text" width={100} />
      </ThermometerRow>
    );
  }

  const progress = Math.min((totalDonatedYtd / goal) * 100, 100);
  const formattedRaised = totalDonatedYtd.toLocaleString();
  const formattedGoal = goal.toLocaleString();

  return (
    <ThermometerRow>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <StyledLinearProgress
          variant="determinate"
          value={progress}
          aria-label={t("donation_banner.progress_label")}
        />
      </Box>
      <ProgressLabel>
        ${formattedRaised} / ${formattedGoal}
      </ProgressLabel>
    </ThermometerRow>
  );
}
