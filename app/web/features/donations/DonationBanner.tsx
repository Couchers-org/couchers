import { Button, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { usePersistedState } from "platform/usePersistedState";
import { useCallback, useEffect, useState } from "react";
import { donationsRoute } from "routes";

import useAccountInfo from "../auth/useAccountInfo";
import DonationDriveBlock from "./DonationDriveBlock";

const TIME_BETWEEN_NAGS_MS = 24 * 60 * 60 * 1000; // 24 hours

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "var(--mui-palette-secondary-main)",
  flexShrink: 0,
  alignSelf: "center",
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  "&:hover": {
    backgroundColor: "var(--mui-palette-secondary-dark)",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    alignSelf: "stretch",
  },
}));

export function DonationBanner() {
  const { t } = useTranslation(GLOBAL);
  const router = useRouter();

  const [lastDismissedEpoch, setLastDismissedEpoch] = usePersistedState<number | null>(
    "donation_banner.dismissed",
    null,
  );
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } = useAccountInfo();

  useEffect(() => {
    const notDismissedRecently =
      !lastDismissedEpoch || new Date().getTime() - lastDismissedEpoch > TIME_BETWEEN_NAGS_MS;

    if (!isAccountInfoLoading && accountInfo?.shouldShowDonationBanner && notDismissedRecently) {
      setBannerVisible(true);
    } else {
      setBannerVisible(false);
    }
  }, [isAccountInfoLoading, accountInfo, lastDismissedEpoch]);

  const handleClose = useCallback(() => {
    setLastDismissedEpoch(new Date().getTime());
    setBannerVisible(false);
  }, [setLastDismissedEpoch]);

  const handleDonateClick = useCallback(() => {
    router.push(`${donationsRoute}?utm_source=donation_banner`);
    setBannerVisible(false);
  }, [router]);

  if (!bannerVisible) return null;

  return (
    <DonationDriveBlock
      onClose={handleClose}
      action={
        <StyledButton variant="contained" onClick={handleDonateClick}>
          {t("donation_banner.button")}
        </StyledButton>
      }
    />
  );
}
