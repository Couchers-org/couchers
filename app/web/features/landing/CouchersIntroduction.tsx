import { Box, styled, Typography, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { theme } from "theme";

interface CouchersIntroductionProps {
  scrollToMore?: () => void;
}

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "45%",
  marginTop: theme.spacing(14),

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

const CouchersIntroduction = ({ scrollToMore }: CouchersIntroductionProps) => {
  const { t } = useTranslation([GLOBAL, LANDING]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <StyledIntroduction>
      <StyledIntroductionText>
        <Typography
          fontSize={theme.typography.h1Large.fontSize}
          lineHeight={1.1}
          sx={{
            [theme.breakpoints.down("md")]: {
              width: "100%",
              textAlign: "center",
              fontWeight: 700,
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
              fontWeight: 500,
              fontStyle: "italic",
              marginTop: theme.spacing(1),
            }}
          >
            {t("landing:introduction_subtitle2")}
          </Typography>
        </>
      </StyledIntroductionText>

      {!isMobile && scrollToMore && (
        <Button
          onClick={scrollToMore}
          size="large"
          color="primary"
          sx={{ marginTop: 2, width: theme.spacing(20), fontSize: "1.3rem" }}
        >
          {t("global:join_us")}
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
            onClick={scrollToMore}
            size="large"
            color="primary"
            sx={{
              marginTop: 2,
              marginLeft: 1,
              width: theme.spacing(20),
              fontSize: "1.3rem",
            }}
          >
            {t("global:join_us")}
          </Button>
        </Box>
      )}
    </StyledIntroduction>
  );
};

export default CouchersIntroduction;
