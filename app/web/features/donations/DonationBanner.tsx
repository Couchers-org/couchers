import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { Alert, alpha, Button, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { donationsRoute } from "routes";
import { theme } from "theme";

import useAccountInfo from "../auth/useAccountInfo";

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

  const [bannerVisible, setBannerVisible] = useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  useEffect(() => {
    if (!isAccountInfoLoading && accountInfo?.shouldShowDonationBanner) {
      setBannerVisible(true);
    } else {
      setBannerVisible(false);
    }
  }, [isAccountInfoLoading, accountInfo]);

  const handleClose = () => {
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
