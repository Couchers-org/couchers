import { styled, Typography } from "@mui/material";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import { signupRoute } from "routes";
import { theme } from "theme";

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "45%",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginTop: 0,
  },
}));

const StyledIntroductionText = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginBottom: theme.spacing(2),
    textAlign: "center",
  },
}));

const CouchersIntroduction = () => {
  const { t } = useTranslation([GLOBAL, LANDING]);
  const router = useRouter();

  const routeToSignupPage = () => {
    router.push(signupRoute);
  };

  return (
    <StyledIntroduction>
      <StyledIntroductionText>
        <Typography
          lineHeight={1.1}
          fontWeight={400}
          sx={{
            fontSize: "3.5rem",

            [theme.breakpoints.down("md")]: {
              width: "100%",
              textAlign: "center",
              marginTop: theme.spacing(6),
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
              marginBottom: theme.spacing(2),
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
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: "1.2rem",
            }}
          >
            {t("landing:introduction_subtitle2")}
          </Typography>
          {router.pathname === "/" && (
            <Button
              onClick={routeToSignupPage}
              size="large"
              color="primary"
              sx={{
                marginTop: 2,
                width: theme.spacing(20),
                fontSize: "1.3rem",
              }}
            >
              {t("global:join_us")}
            </Button>
          )}
        </>
      </StyledIntroductionText>
    </StyledIntroduction>
  );
};

export default CouchersIntroduction;
