import { Link, styled, Typography } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import Markdown from "components/Markdown";
import Landscape from "features/donations/resources/landscape.jpeg";
import { DONATIONS, GLOBAL } from "i18n/namespaces";
import { Trans, useTranslation } from "next-i18next";
import CouchersLogo from "resources/CouchersLogo";
import { foundationRoute, latestFinancialsURL } from "routes";
import { theme } from "theme";

import { BENEFACTOR_EMAIL } from "./constants";
import DonationsBox from "./DonationsBox";

const LATEST_FINANCIALS_YEAR = latestFinancialsURL.slice(-4);

const StyledBanner = styled("div")(() => ({
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "120px",
}));

const StyledLogoWrapper = styled("div")(() => ({
  position: "relative",
  zIndex: 1,
  maxWidth: "68.75rem",
  display: "flex",
  alignItems: "center",
  width: "100%",
  [theme.breakpoints.down("lg")]: {
    maxWidth: "42rem",
  },
  [theme.breakpoints.down("md")]: {
    margin: theme.spacing(0, 3),
  },
}));

const StyledLogo = styled(CouchersLogo)(() => ({
  height: "72px",
  width: "auto",
}));

const StyledLogoText = styled("div")(() => ({
  marginLeft: theme.spacing(2),
}));

const StyledImage = styled("img")(() => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  opacity: 0.3,
}));

const StyledBody = styled("section")(() => ({
  display: "grid",
  gridTemplateColumns: "39rem 25.5rem",
  columnGap: theme.spacing(7.5),
  position: "relative",
  left: "50%",
  transform: "translateX(-50%)",
  justifyContent: "center",
  margin: theme.spacing(3, 0, 9, 0),
  [theme.breakpoints.down("lg")]: {
    maxWidth: "42rem",
    display: "flex",
    flexDirection: "column",
  },
  [theme.breakpoints.down("md")]: {
    maxWidth: "initial",
    left: "initial",
    transform: "initial",
    padding: theme.spacing(0, 3),
  },
}));

const StyledPrimarySection = styled("div")(() => ({
  gridRow: "1 / 5",
  gridColumn: "1 / 2",
  paddingBottom: theme.spacing(3),
}));

const StyledSecondarySection = styled("div")(() => ({
  gridRow: "4 / 5",
  gridColumn: "2 / 3",
}));

const StyledDonationsBoxSection = styled("div")(() => ({
  gridRow: "1 / 3",
  gridColumn: "2 / 3",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(3),
}));

const StyledBenefactorText = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export default function Donations() {
  const { t } = useTranslation([GLOBAL, DONATIONS]);

  return (
    <>
      <HtmlMeta title={t("donations:donate")} />
      <StyledBanner>
        <StyledLogoWrapper>
          <StyledLogo />
          <StyledLogoText>
            <Typography variant="h2">
              {t("donations:donations_banner.title")}
            </Typography>
            <Typography>{t("donations:donations_banner.body")}</Typography>
          </StyledLogoText>
        </StyledLogoWrapper>
        <StyledImage src={Landscape.src} alt="" />
      </StyledBanner>
      <StyledBody>
        <StyledDonationsBoxSection>
          {/* COMMENTED OUT TIL NEXT DONATION DRIVE
           * <DonationDriveBlock alwaysShow />
           */}
          <DonationsBox />
          <StyledBenefactorText>
            <Typography variant="body2">
              <Trans
                i18nKey="donations:donations_info"
                components={{
                  1: (
                    <Link
                      key={"foundation-route-link"}
                      href={foundationRoute}
                      underline="hover"
                    />
                  ),
                }}
                values={{ legal_name: t("global:legal_name") }}
              />
            </Typography>
            <Typography variant="body2">
              <Trans
                t={t}
                i18nKey="donations:benefactor_contact"
                components={{
                  1: (
                    <Link
                      key="benefactor-email-link"
                      href={`mailto:${BENEFACTOR_EMAIL}`}
                      underline="hover"
                    />
                  ),
                }}
                values={{ email: BENEFACTOR_EMAIL }}
              />
            </Typography>
          </StyledBenefactorText>
        </StyledDonationsBoxSection>
        <StyledPrimarySection>
          <Typography variant="h1">{t("donations:donations_title")}</Typography>
          <Markdown source={t("donations:donations_text")} />
        </StyledPrimarySection>
        <StyledSecondarySection>
          <Typography variant="h2">
            {t("donations:donations_title2")}
          </Typography>
          <Markdown source={t("donations:donations_text2")} />
          <Typography variant="body1">
            <Link href={latestFinancialsURL} underline="hover">
              {t("donations:donations_use_explainer", {
                year: LATEST_FINANCIALS_YEAR,
              })}
            </Link>
          </Typography>
        </StyledSecondarySection>
      </StyledBody>
    </>
  );
}
