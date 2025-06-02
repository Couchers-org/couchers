import { Box, Divider, styled, Typography, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import { loginRoute } from "routes";
import { theme } from "theme";

interface CouchersIntroductionProps {
  scrollToMore?: () => void;
}

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.common.white,
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "55%",
  maxWidth: theme.breakpoints.values.xl / 2,
  marginInlineEnd: "10%",
  marginTop: theme.spacing(12),
  gap: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
}));

const StyledIntroductionText = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginBottom: theme.spacing(2),
    textAlign: "center",
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderTop: `4px solid ${theme.palette.primary.main}`,
  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
  position: "absolute",
  width: "100%",
}));

const CouchersIntroduction = ({ scrollToMore }: CouchersIntroductionProps) => {
  const { t } = useTranslation([GLOBAL, LANDING]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const routeToLogin = () => {
    router.push(loginRoute);
  };

  return (
    <StyledIntroduction>
      <StyledIntroductionText>
        <Typography
          variant="h1"
          sx={{
            [theme.breakpoints.down("md")]: {
              width: "100%",
              textAlign: "center",
            },
          }}
        >
          {t("landing:introduction_title")}
        </Typography>
        <>
          <Typography
            variant="h2"
            component="span"
            sx={{
              display: "inline-block",
              marginTop: theme.spacing(3),
              position: "relative",
              fontWeight: 400,
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
            variant="h3"
            component="span"
            sx={{
              display: "inline-block",
              position: "relative",
              fontWeight: 400,
              marginTop: theme.spacing(3),
            }}
          >
            {t("landing:introduction_subtitle2")}
            <StyledDivider />
          </Typography>
        </>
      </StyledIntroductionText>

      {!isMobile && scrollToMore && (
        <Button
          onClick={scrollToMore}
          size="large"
          color="secondary"
          sx={{ marginTop: 2, width: theme.spacing(20) }}
        >
          {t("global:read_more")}
        </Button>
      )}
      {isMobile && scrollToMore && (
        <Box
          fontSize="large"
          sx={{
            display: "flex",
            marginBottom: 6,
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Button
            onClick={routeToLogin}
            size="large"
            color="secondary"
            sx={{ marginTop: 2, width: theme.spacing(20) }}
          >
            {t("global:login")}
          </Button>
          <Button
            onClick={scrollToMore}
            size="large"
            color="primary"
            sx={{ marginTop: 2, marginLeft: 1, width: theme.spacing(20) }}
          >
            {t("global:sign_up")}
          </Button>
        </Box>
      )}
    </StyledIntroduction>
  );
};

export default CouchersIntroduction;
