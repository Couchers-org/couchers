import {
  CheckCircleOutlineRounded,
  DoDisturb,
  PendingRounded,
} from "@mui/icons-material";
import { styled, Typography } from "@mui/material";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { HostingStatus, MeetupStatus, User } from "proto/api_pb";
import { theme } from "theme";

const Wrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isNegative",
})<{ isNegative: boolean }>(({ theme, isNegative }) => ({
  display: "flex",
  alignItems: "center",
  fontWeight: 600,
  color: isNegative ? theme.palette.grey[600] : theme.palette.common.black,
  fontSize: "0.875rem",

  [theme.breakpoints.down("md")]: {
    fontSize: "0.75rem",
  },
}));

const VerticalLine = styled("div")(({ theme }) => ({
  color: theme.palette.grey[300],
  paddingRight: theme.spacing(0.5),
  paddingLeft: theme.spacing(0.5),
}));

const generateReferenceText = (numberReferences: number, t: TFunction) => {
  if (numberReferences === 0) {
    return t("profile:reference_amounts.no_references");
  } else if (numberReferences === 1) {
    return `1 ${t("profile:reference_amounts.references_single")}`;
  } else if (numberReferences >= 100) {
    return `100+ ${t("profile:reference_amounts.references_plural")}`;
  } else {
    return `${numberReferences} ${t(
      "profile:reference_amounts.references_plural",
    )}`;
  }
};

const HostMeetupReferenceStatus = ({
  hostingStatus,
  meetupStatus,
  numberReferences,
}: {
  hostingStatus: User.AsObject["hostingStatus"];
  meetupStatus: User.AsObject["meetupStatus"];
  numberReferences: User.AsObject["numReferences"];
}) => {
  const { t } = useTranslation([PROFILE]);

  return (
    <Wrapper>
      <StyledTypography
        display="inline"
        variant="body1"
        isNegative={hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST}
      >
        {hostingStatus === HostingStatus.HOSTING_STATUS_CAN_HOST && (
          <CheckCircleOutlineRounded
            fontSize="small"
            sx={{
              color: theme.palette.success.main,
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST && (
          <DoDisturb
            fontSize="small"
            sx={{
              color: theme.palette.error.main,
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {hostingStatus === HostingStatus.HOSTING_STATUS_MAYBE && (
          <PendingRounded
            fontSize="small"
            sx={{
              color: theme.palette.grey[600],
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {hostingStatusLabels(t)[hostingStatus]}
      </StyledTypography>
      <VerticalLine>|</VerticalLine>
      <StyledTypography
        display="inline"
        variant="body1"
        isNegative={
          meetupStatus === MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP
        }
      >
        {meetupStatus === MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP && (
          <CheckCircleOutlineRounded
            fontSize="small"
            sx={{
              color: theme.palette.success.main,
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {meetupStatus ===
          MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP && (
          <DoDisturb
            fontSize="small"
            sx={{
              color: theme.palette.error.main,
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {meetupStatus === MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP && (
          <PendingRounded
            fontSize="small"
            sx={{
              color: theme.palette.grey[600],
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {meetupStatusLabels(t)[meetupStatus]}
      </StyledTypography>
      <VerticalLine>|</VerticalLine>
      <StyledTypography variant="body2" isNegative={numberReferences === 0}>
        {numberReferences > 0 && (
          <CheckCircleOutlineRounded
            fontSize="small"
            sx={{
              color: theme.palette.success.main,
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {numberReferences === 0 && (
          <DoDisturb
            fontSize="small"
            sx={{
              color: theme.palette.error.main,
              fontSize: "0.875rem",
              marginRight: theme.spacing(0.5),
            }}
          />
        )}
        {generateReferenceText(numberReferences, t)}
      </StyledTypography>
    </Wrapper>
  );
};

export default HostMeetupReferenceStatus;
