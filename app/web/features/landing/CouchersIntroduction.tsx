import { Typography, styled, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";

import Button from "@/components/Button";
import { Trans, useTranslation } from "@/i18n";
import { GLOBAL, LANDING } from "@/i18n/namespaces";
import { SIGNUP_ROUTE } from "@/routes";
import { theme } from "@/theme";

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
    router.push(SIGNUP_ROUTE);
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
        {router.pathname === "/" && !isMobile && (
          <Button
            onClick={routeToSignupPage}
            size="large"
            color="primary"
            sx={{
              marginTop: 4,
              width: theme.spacing(20),
              fontSize: "1.3rem",
            }}
          >
            {t("global:join_us")}
          </Button>
        )}
      </>
    </StyledIntroduction>
  );
};

export default CouchersIntroduction;
