import { Favorite, Language, People, Star } from "@mui/icons-material";
import { Box, Skeleton, styled, Typography } from "@mui/material";
import { UseQueryResult } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { LANDING, PRESS } from "i18n/namespaces";
import { useEffect, useState } from "react";
import { timeAgo } from "utils/timeAgo";

import { GetVolunteersRes } from "../../proto/public_pb";
import StyledBox from "./StyledBox";
import StyledSubheading from "./StyledSubheading";

interface SignupInfo {
  userCount: string;
  lastSignup: string | Date;
  lastLocation: string;
}

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
    <Box width={width}>
      <Typography sx={textStyle}>
        <Box component="span" display="inline-block" width="100%">
          <Skeleton variant="text" width="100%" />
        </Box>
      </Typography>
    </Box>
  );
}

type FactsProps = {
  volunteers: UseQueryResult<GetVolunteersRes.AsObject, RpcError>;
};

export default function Facts({ volunteers }: FactsProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([LANDING, PRESS]);
  const [signupInfo, setSignupInfo] = useState<SignupInfo | null>(null);
  const [isSignupInfoLoading, setIsSignupInfoLoading] = useState(true);

  useEffect(() => {
    const fetchSignupInfo = async () => {
      try {
        const response = await fetch(
          "https://couchers.org/api/public/signup-page-info",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch signup info");
        }
        const data = await response.json();
        setSignupInfo(data);
      } catch (error) {
        console.error("Error fetching signup info:", error);
      } finally {
        setIsSignupInfoLoading(false);
      }
    };

    fetchSignupInfo();
  }, []);

  const currentVolunteersList = volunteers.data?.currentVolunteersList ?? [];
  const pastVolunteersList = volunteers.data?.pastVolunteersList ?? [];
  const volunteersNumber =
    currentVolunteersList.length + pastVolunteersList.length;

  const isLoading = isSignupInfoLoading || volunteers.isLoading;

  return (
    <StyledBox>
      <StyledSubheading>{t("press:facts_subheading")}</StyledSubheading>
      <StyledWrapper>
        <Box display="flex" alignItems="center">
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
        <Box display="flex" alignItems="center">
          <Language sx={iconStyle} />
          {isLoading ? (
            <Loader width="9.5rem" />
          ) : (
            <Typography sx={textStyle}>
              {t("landing:num_countries2", { count: 180 })}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center">
          <Star sx={iconStyle} />
          {isLoading ? (
            <Loader width="14.5rem" />
          ) : signupInfo?.lastSignup ? (
            <Typography sx={textStyle}>
              {t("landing:last_signup", {
                timeAgo: timeAgo({
                  since: new Date(signupInfo.lastSignup),
                  t,
                  locale,
                }),
              })}
            </Typography>
          ) : null}
        </Box>
        <Box display="flex" alignItems="center">
          <People sx={iconStyle} />
          {isLoading ? (
            <Loader width="7.5rem" />
          ) : (
            <Typography sx={textStyle}>
              {t("press:num_volunteers2", { count: volunteersNumber })}
            </Typography>
          )}
        </Box>
      </StyledWrapper>
    </StyledBox>
  );
}
