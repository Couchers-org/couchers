import { Stack, styled, Typography, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import {
  couchersAppStoreURL,
  couchersGooglePlayURL,
  signupRoute,
  whatIsCouchSurfingRoute,
} from "routes";
import { theme } from "theme";

function AppStoreBadges({ appStoreHeight = 38 }: { appStoreHeight?: number }) {
  const { t } = useTranslation(GLOBAL);
  // App Store SVG is naturally 40px tall; Google Play SVG is naturally 60px tall.
  // Use a 1:1.5 ratio so both badges appear the same visual size.
  const googlePlayHeight = appStoreHeight * 1.5;
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        marginTop: 2,
        flexWrap: "wrap",
        width: "fit-content",
        alignItems: "center",
        mx: { xs: "auto", md: 0 },
      }}
    >
      <a href={couchersAppStoreURL} target="_blank" rel="noopener noreferrer">
        <img
          src="/img/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"
          alt={t("download_on_app_store")}
          style={{
            height: `${appStoreHeight}px`,
            width: "auto",
            display: "block",
          }}
        />
      </a>
      <a href={couchersGooglePlayURL} target="_blank" rel="noopener noreferrer">
        <img
          src="/img/GetItOnGooglePlay_Badge_Web_color_English.svg"
          alt={t("get_it_on_google_play")}
          style={{
            height: `${googlePlayHeight}px`,
            width: "auto",
            display: "block",
          }}
        />
      </a>
    </Stack>
  );
}

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "45%",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    alignItems: "center",
    textAlign: "center",
  },
}));

const CouchersIntroduction = () => {
  const { t } = useTranslation([GLOBAL, LANDING]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const routeToSignupPage = () => {
    router.push(signupRoute);
  };
  const routeToLearnMore = () => {
    router.push(whatIsCouchSurfingRoute);
  };

  return (
    <StyledIntroduction>
      <Typography
        lineHeight={1.1}
        fontWeight="bold"
        sx={{
          fontSize: "3.5rem",

          [theme.breakpoints.down("md")]: {
            width: "100%",
            marginBottom: theme.spacing(2),
            fontSize: "2rem",
          },
        }}
      >
        {t("landing:introduction_title")}
      </Typography>
      <>
        <Typography
          sx={{
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(1),
            position: "relative",
            fontWeight: 400,
            fontSize: "1.3rem",
          }}
        >
          <Trans
            i18nKey="landing:introduction_subtitle"
            components={{
              bold: <strong style={{ fontWeight: 700 }} />,
            }}
          />
        </Typography>
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "1.2rem",
          }}
        >
          {t("landing:introduction_subtitle2")}
        </Typography>
        {!isMobile && (
          <>
            <Stack direction="row" spacing={2} sx={{ marginTop: 4 }}>
              <Button
                onClick={routeToSignupPage}
                size="large"
                color="primary"
                sx={{
                  minWidth: theme.spacing(20),
                  fontSize: "1.2rem",
                  paddingX: theme.spacing(3),
                }}
              >
                {t("global:join_us")}
              </Button>
              <Button
                onClick={routeToLearnMore}
                size="large"
                variant="outlined"
                color="primary"
                sx={{
                  minWidth: theme.spacing(20),
                  fontSize: "1.2rem",
                  paddingX: theme.spacing(3),
                }}
              >
                {t("global:learn_more")}
              </Button>
            </Stack>
            <AppStoreBadges appStoreHeight={42} />
          </>
        )}
        {isMobile && (
          <>
            <Button
              onClick={routeToLearnMore}
              size="medium"
              variant="text"
              color="primary"
              sx={{ mt: 2 }}
            >
              {t("global:learn_more")}
            </Button>
            <AppStoreBadges />
          </>
        )}
      </>
    </StyledIntroduction>
  );
};

export default CouchersIntroduction;
