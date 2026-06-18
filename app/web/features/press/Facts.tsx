import { Favorite, Language, People, Star } from "@mui/icons-material";
import { Box, Skeleton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, PRESS } from "i18n/namespaces";
import { useEffect, useState } from "react";
import { theme } from "theme";
import { timeAgo } from "utils/timeAgo";

import { useListVolunteers } from "../communities/hooks";
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
  color: theme.palette.primary.main,
};

const textStyle = { fontSize: "1.25rem" };

function Loader() {
  return (
    <Box sx={{ width: 180 }}>
      <Typography sx={textStyle}>
        <Box component="span" display="inline-block" width="100%">
          <Skeleton variant="text" width="100%" height={36} />
        </Box>
      </Typography>
    </Box>
  );
}

export default function Facts() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, PRESS]);
  const [signupInfo, setSignupInfo] = useState<SignupInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const volunteers = useListVolunteers();
  const currentVolunteersList = volunteers.data?.currentVolunteersList;
  const pastVolunteersList = volunteers.data?.pastVolunteersList;
  const volunteersNumber =
    currentVolunteersList && pastVolunteersList
      ? currentVolunteersList?.length + pastVolunteersList?.length
      : undefined;

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
        setIsLoading(false);
      }
    };

    fetchSignupInfo();
  }, []);

  return (
    <StyledBox>
      <StyledSubheading>At a glance</StyledSubheading>
      <StyledWrapper>
        <Box display="flex" alignItems="center">
          <Favorite sx={iconStyle} />
          {isLoading ? (
            <Loader />
          ) : (
            <Typography sx={textStyle}>
              {t("press:num_users2", {
                // Number(...) returns NaN on bad input, and || treats it as false
                count: Number(signupInfo?.userCount) || 77000,
              })}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center">
          <Language sx={iconStyle} />
          <Typography sx={textStyle}>
            {t("press:num_countries2", { count: 180 })}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Star sx={iconStyle} />
          {isLoading ? (
            <Loader />
          ) : (
            signupInfo &&
            signupInfo.lastSignup && (
              <Typography sx={textStyle}>
                {t("press:last_signup", {
                  timeAgo: timeAgo({
                    since: new Date(signupInfo.lastSignup),
                    t,
                    locale,
                  }),
                })}
              </Typography>
            )
          )}
        </Box>
        {volunteersNumber ? (
          <Box display="flex" alignItems="center">
            <People sx={iconStyle} />
            <Typography sx={textStyle}>
              {volunteersNumber}+ volunteers
            </Typography>
          </Box>
        ) : null}
      </StyledWrapper>
    </StyledBox>
  );
}
