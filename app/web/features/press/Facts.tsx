import { Favorite, Language, People, Star } from "@mui/icons-material";
import { Box, Skeleton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANDING, PRESS } from "i18n/namespaces";
import { Trans } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import useSignupPageInfo from "utils/useSignupPageInfo";

import RelativeTime from "../../components/RelativeTime";
import { useListVolunteers } from "../communities/hooks";
import SectionHeading from "./SectionHeading";
import SectionWrapper from "./SectionWrapper";

const StyledWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
  gap: "1rem",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: "1rem",
  paddingRight: "1rem",
  width: "100%",

  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },

  [theme.breakpoints.up("md")]: {
    gap: "1.5rem",
  },
}));

const iconStyle = {
  marginRight: 1,
  fontSize: "30px",
  color: "var(--mui-palette-primary-main)",
};

const textStyle = { fontSize: "1.25rem" };

type LoaderProps = {
  width: string;
};

function Loader({ width }: LoaderProps) {
  return (
    <Box sx={{ width: width }}>
      <Typography sx={textStyle}>
        <Box
          component="span"
          sx={{
            display: "inline-block",
            width: "100%",
          }}
        >
          <Skeleton variant="text" width="100%" />
        </Box>
      </Typography>
    </Box>
  );
}

export default function Facts() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([LANDING, PRESS]);
  const { signupInfo, isLoading: isSignupInfoLoading } = useSignupPageInfo();
  const volunteers = useListVolunteers();

  const currentVolunteersList = volunteers.data?.currentVolunteersList ?? [];
  const pastVolunteersList = volunteers.data?.pastVolunteersList ?? [];
  const volunteersNumber = currentVolunteersList.length + pastVolunteersList.length;

  const isLoading = isSignupInfoLoading || volunteers.isLoading;

  return (
    <SectionWrapper>
      <SectionHeading>{t("press:facts_subheading")}</SectionHeading>
      <StyledWrapper>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Favorite sx={iconStyle} />
          {isLoading ? (
            <Loader width="9rem" />
          ) : (
            <Typography sx={textStyle}>
              {t("landing:num_users2", {
                // Number(...) returns NaN on bad input, and || treats it as false
                count: Number(signupInfo?.userCount) || 77000,
              })}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Language sx={iconStyle} />
          {isLoading ? (
            <Loader width="9.5rem" />
          ) : (
            <Typography sx={textStyle}>{t("landing:num_countries2", { count: 180 })}</Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Star sx={iconStyle} />
          {isLoading ? (
            <Loader width="14.5rem" />
          ) : signupInfo?.lastSignup ? (
            <Typography sx={textStyle}>
              <Trans
                t={t}
                i18nKey="landing:last_signup2"
                components={{
                  timeAgo: <RelativeTime instant={Temporal.Instant.from(signupInfo.lastSignup)} />,
                }}
              />
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <People sx={iconStyle} />
          {isLoading ? (
            <Loader width="7.5rem" />
          ) : (
            <Typography sx={textStyle}>{t("press:num_volunteers", { count: volunteersNumber })}</Typography>
          )}
        </Box>
      </StyledWrapper>
    </SectionWrapper>
  );
}
