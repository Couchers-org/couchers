import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { Alert, alpha, styled } from "@mui/material";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

import DonationProgressBar from "./DonationProgressBar";

export interface DonationDriveBlockProps {
  onClose?: () => void;
  action?: React.ReactNode;
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
  color: theme.palette.text.secondary,
  [theme.breakpoints.down("md")]: {
    textAlign: "center",
  },
}));

export default function DonationDriveBlock({
  onClose,
  action,
}: DonationDriveBlockProps) {
  const { t } = useTranslation(GLOBAL);
  const { data: accountInfo, isLoading } = useAccountInfo();

  if (isLoading || !accountInfo?.shouldShowDonationBanner) {
    return null;
  }

  return (
    <Alert
      icon={<VolunteerActivismIcon />}
      onClose={onClose}
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
          <DonationProgressBar />
          <Message>{t("donation_banner.message")}</Message>
        </ContentWrapper>
        {action}
      </OuterWrapper>
    </Alert>
  );
}
