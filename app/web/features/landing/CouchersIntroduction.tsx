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
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(GLOBAL);
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        marginTop: 2,
        width: "fit-content",
        mx: { xs: "auto", md: 0 },
      }}
    >
      <a href={couchersAppStoreURL} target="_blank" rel="noopener noreferrer">
        <img
          src={`/img/app-store-badge/${locale}.svg`}
          alt={t("app_store_badge_a11y")}
          style={{
            height: `${appStoreHeight}px`,
            width: "auto",
            display: "block",
          }}
        />
      </a>
      <a href={couchersGooglePlayURL} target="_blank" rel="noopener noreferrer">
        <img
          src={`/img/google-play-badge/${locale}.svg`}
          alt={t("google_play_badge_a11y")}
          style={{
            height: `${appStoreHeight}px`,
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
              size="large"
              variant="text"
              color="primary"
              sx={{ mt: 2, fontSize: "1.1rem", textDecoration: "underline" }}
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
