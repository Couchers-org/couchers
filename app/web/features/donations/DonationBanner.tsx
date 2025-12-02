import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import {
  Alert,
  alpha,
  Box,
  Button,
  LinearProgress,
  styled,
} from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect, useState } from "react";
import { donationsRoute } from "routes";
import { theme } from "theme";

import useAccountInfo from "../auth/useAccountInfo";
import useDonationStats from "./useDonationStats";

const TIME_BETWEEN_NAGS_MS = 24 * 60 * 60 * 1000; // 24 hours

const OuterWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(1.5),
  },
}));

const ContentWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  gap: theme.spacing(0.75),
}));

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

const Message = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  color: theme.palette.text.secondary,
  [theme.breakpoints.down("md")]: {
    textAlign: "center",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  flexShrink: 0,
  alignSelf: "center",
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  "&:hover": {
    backgroundColor: theme.palette.secondary.dark,
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    alignSelf: "stretch",
  },
}));

export function DonationBanner() {
  const { t } = useTranslation(GLOBAL);
  const router = useRouter();

  const [lastDismissedEpoch, setLastDismissedEpoch] = usePersistedState<
    number | null
  >("donation_banner.dismissed", null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);

  const { data: apiDonationStats, isLoading } = useDonationStats();
  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  useEffect(() => {
    if (!isLoading && apiDonationStats) {
      setBannerVisible(
        !lastDismissedEpoch ||
          new Date().getTime() - lastDismissedEpoch > TIME_BETWEEN_NAGS_MS,
      );
    }
  }, [isLoading, apiDonationStats, lastDismissedEpoch]);

  useEffect(() => {
    if (!isAccountInfoLoading && accountInfo?.shouldShowDonationBanner) {
      setBannerVisible(
        !lastDismissedEpoch ||
          new Date().getTime() - lastDismissedEpoch > TIME_BETWEEN_NAGS_MS,
      );
    } else {
      setBannerVisible(false);
    }
  }, [isAccountInfoLoading, accountInfo, lastDismissedEpoch]);

  const handleClose = () => {
    setLastDismissedEpoch(new Date().getTime());
    setBannerVisible(false);
  };

  const handleDonateClick = () => {
    router.push(`${donationsRoute}?utm_source=donation_banner`);
    setBannerVisible(false);
  };

  if (!bannerVisible || !apiDonationStats) return null;

  const progress = Math.min(
    (apiDonationStats.totalDonatedYtd / apiDonationStats.goal) * 100,
    100,
  );

  const formattedRaised = apiDonationStats.totalDonatedYtd.toLocaleString();
  const formattedGoal = apiDonationStats.goal.toLocaleString();

  return (
    <Alert
      icon={<VolunteerActivismIcon />}
      onClose={handleClose}
      sx={{
        alignItems: "center",
        ".MuiAlert-message": { width: "100%", py: 0.5 },
        backgroundColor: alpha(theme.palette.secondary.main, 0.08),
        color: theme.palette.text.primary,
        "& .MuiAlert-icon": {
          color: theme.palette.secondary.main,
          alignSelf: "center",
        },
        [theme.breakpoints.down("md")]: {
          alignItems: "flex-start",
          "& .MuiAlert-icon": {
            paddingTop: "10px",
          },
        },
      }}
    >
      <OuterWrapper>
        <ContentWrapper>
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
          <Message>{t("donation_banner.message")}</Message>
        </ContentWrapper>
        <StyledButton variant="contained" onClick={handleDonateClick}>
          {t("donation_banner.button")}
        </StyledButton>
      </OuterWrapper>
    </Alert>
  );
}
