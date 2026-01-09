import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { Alert, alpha, styled } from "@mui/material";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

import DonationProgressBar from "./DonationProgressBar";
import useDonationStats from "./useDonationStats";

export interface DonationDriveBlockProps {
  onClose?: () => void;
  action?: React.ReactNode;
  alwaysShow?: boolean;
}

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

const Message = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  color: "var(--mui-palette-text-secondary)",
  [theme.breakpoints.down("md")]: {
    textAlign: "center",
  },
}));

export default function DonationDriveBlock({
  onClose,
  action,
  alwaysShow = false,
}: DonationDriveBlockProps) {
  const { t, i18n } = useTranslation(GLOBAL);
  const { data: accountInfo, isLoading } = useAccountInfo();
  const { data: donationStats } = useDonationStats();

  if (!alwaysShow && (isLoading || !accountInfo?.shouldShowDonationBanner)) {
    return null;
  }

  const formattedGoal = donationStats
    ? new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(donationStats.goal)
    : "";

  return (
    <Alert
      icon={<VolunteerActivismIcon />}
      onClose={onClose}
      sx={{
        alignItems: "center",
        ".MuiAlert-message": { width: "100%", py: 0.5 },
        backgroundColor: alpha(theme.palette.secondary.main, 0.08),
        color: "var(--mui-palette-text-primary)",
        "& .MuiAlert-icon": {
          color: "var(--mui-palette-secondary-main)",
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
          <DonationProgressBar />
          <Message>
            {t("donation_banner.message", { goal: formattedGoal })}
          </Message>
        </ContentWrapper>
        {action}
      </OuterWrapper>
    </Alert>
  );
}
