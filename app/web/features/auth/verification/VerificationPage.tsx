import { LocalPostOfficeOutlined, LockOutlined, SmartphoneOutlined, VerifiedUser } from "@mui/icons-material";
import { Box, GlobalStyles, keyframes, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Divider from "components/Divider";
import HtmlMeta from "components/HtmlMeta";
import useAccountInfo from "features/auth/useAccountInfo";
import { useGate } from "features/experimentation";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { ReactNode } from "react";

import PhoneVerificationSection from "./PhoneVerificationSection";
import PostalVerificationSection from "./PostalVerificationSection";
import StrongVerificationSection from "./StrongVerificationSection";

const PageWidth = styled("div")(({ theme }) => ({
  width: "100%",
  maxWidth: 900,
  marginInline: "auto",
  paddingInline: theme.spacing(2),
  boxSizing: "border-box",
}));

const float = keyframes({
  "0%, 100%": { transform: "translateY(0) rotate(var(--tilt, 0deg))" },
  "50%": { transform: "translateY(-8px) rotate(var(--tilt, 0deg))" },
});

const HeroArt = styled("div")(({ theme }) => ({
  flex: "0 0 auto",
  position: "relative",
  width: 188,
  height: 132,
  // Decorative only, so it goes rather than squeezing the intro copy.
  [theme.breakpoints.down("md")]: { display: "none" },
}));

const FloatingTile = styled("span")({
  position: "absolute",
  display: "grid",
  placeItems: "center",
  backgroundColor: "var(--mui-palette-background-paper)",
  border: "1px solid var(--mui-palette-divider)",
  animation: `${float} var(--float-duration) ease-in-out var(--float-delay, 0s) infinite`,
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

function HeroTiles() {
  return (
    <HeroArt aria-hidden>
      <FloatingTile
        sx={{
          "--tilt": "-8deg",
          "--float-duration": "5.5s",
          left: 0,
          top: 24,
          width: 66,
          height: 66,
          borderRadius: "18px",
          "& .MuiSvgIcon-root": { fontSize: 30, color: "var(--mui-palette-primary-main)" },
        }}
      >
        <VerifiedUser />
      </FloatingTile>
      <FloatingTile
        sx={{
          "--tilt": "7deg",
          "--float-duration": "6.4s",
          "--float-delay": "0.6s",
          right: 6,
          top: 0,
          width: 62,
          height: 62,
          borderRadius: "18px",
          "& .MuiSvgIcon-root": { fontSize: 28, color: "var(--mui-palette-secondary-main)" },
        }}
      >
        <SmartphoneOutlined />
      </FloatingTile>
      <FloatingTile
        sx={{
          "--tilt": "-3deg",
          "--float-duration": "7.2s",
          "--float-delay": "1.1s",
          left: 58,
          bottom: 0,
          width: 72,
          height: 72,
          borderRadius: "20px",
          "& .MuiSvgIcon-root": { fontSize: 32, color: "var(--mui-palette-primary-dark)" },
        }}
      >
        <LocalPostOfficeOutlined />
      </FloatingTile>
    </HeroArt>
  );
}

function DataUseSection({ heading, body }: { heading: string; body: ReactNode }) {
  return (
    <Box
      component="section"
      sx={(theme) => ({
        border: "1px solid var(--mui-palette-divider)",
        borderRadius: "10px",
        padding: theme.spacing(2.5),
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <LockOutlined sx={{ fontSize: 24, color: "var(--mui-palette-primary-main)" }} />
        <Typography variant="h2">{heading}</Typography>
      </Box>
      <Typography variant="body1" sx={{ textWrap: "pretty" }}>
        {body}
      </Typography>
    </Box>
  );
}

export default function VerificationPage() {
  const { t } = useTranslation(AUTH);
  const isPostalVerificationEnabled = useGate("postal_verification_enabled");
  const { data: accountInfo, error: accountInfoError, isLoading: isAccountInfoLoading } = useAccountInfo();

  return (
    <>
      <HtmlMeta title={t("verification_page.title")} />
      {/* The nav bar is a Paper, so it sits on background.paper while the body
          defaults to background.default. Match it so the page reads as one
          surface. `html body` outranks CssBaseline's `body` rule regardless of
          which stylesheet is inserted first. */}
      <GlobalStyles styles={{ "html body": { backgroundColor: "var(--mui-palette-background-paper)" } }} />

      <PageWidth
        sx={(theme) => ({
          paddingBlock: theme.spacing(3, 1),
          display: "flex",
          gap: 3,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        })}
      >
        <Box sx={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="h1">{t("verification_page.title")}</Typography>
          <Typography variant="body1" sx={{ color: "var(--mui-palette-text-secondary)", textWrap: "pretty" }}>
            {t("verification_page.intro")}
          </Typography>
        </Box>
        <HeroTiles />
      </PageWidth>

      <PageWidth
        sx={(theme) => ({
          paddingBlock: theme.spacing(3, 4),
          display: "flex",
          flexDirection: "column",
          gap: 4,
        })}
      >
        {isAccountInfoLoading ? (
          <CenteredSpinner />
        ) : accountInfoError ? (
          <Alert severity="error">{accountInfoError.message}</Alert>
        ) : accountInfo ? (
          <>
            <StrongVerificationSection hasStrongVerification={accountInfo.hasStrongVerification} />
            <Divider spacing={0} />
            <PhoneVerificationSection accountInfo={accountInfo} />
            {isPostalVerificationEnabled && (
              <>
                <Divider spacing={0} />
                <PostalVerificationSection />
              </>
            )}
          </>
        ) : null}

        <DataUseSection heading={t("verification_page.data_use.header")} body={t("verification_page.data_use.body")} />
      </PageWidth>
    </>
  );
}
