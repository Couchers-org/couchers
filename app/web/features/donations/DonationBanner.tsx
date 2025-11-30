import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { Alert, alpha, Button, styled, useTheme } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect, useState } from "react";
import { donationsRoute } from "routes";

import useAccountInfo from "../auth/useAccountInfo";

const TIME_BETWEEN_NAGS_MS = 24 * 60 * 60 * 1000; // 24 hours

const Wrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(1),
  },
}));

export function DonationBanner() {
  const { t } = useTranslation(GLOBAL);
  const router = useRouter();
  const theme = useTheme();

  // the epoch value of the last time this banner was dismissed
  const [lastDismissedEpoch, setLastDismissedEpoch] = usePersistedState<
    number | null
  >("donation_banner.dismissed", null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

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

  if (!bannerVisible) return null;

  return (
    <Alert
      icon={<VolunteerActivismIcon />}
      onClose={handleClose}
      sx={{
        alignItems: "center",
        ".MuiAlert-message": { width: "100%" },
        backgroundColor: alpha(theme.palette.secondary.main, 0.08),
        color: theme.palette.text.primary,
        "& .MuiAlert-icon": {
          color: theme.palette.secondary.main,
        },
      }}
    >
      <Wrapper>
        <span>{t("donation_banner.message")}</span>
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: theme.palette.secondary.main,
            flexShrink: 0,
            "&:hover": {
              backgroundColor: theme.palette.secondary.dark,
            },
          }}
          onClick={handleDonateClick}
        >
          {t("donation_banner.button")}
        </Button>
      </Wrapper>
    </Alert>
  );
}
