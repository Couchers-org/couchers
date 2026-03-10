import { Stack, styled, Typography } from "@mui/material";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import { signupRoute, whatIsCouchSurfingRoute } from "routes";
import { theme } from "theme";
import useIsMobile from "utils/useIsMobile";

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
  const isMobile = useIsMobile();

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
        )}
        {isMobile && (
          <Button
            onClick={routeToLearnMore}
            size="medium"
            variant="text"
            color="primary"
            sx={{ mt: 2 }}
          >
            {t("global:learn_more")}
          </Button>
        )}
      </>
    </StyledIntroduction>
  );
};

export default CouchersIntroduction;
