import { Box, Container, styled } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { signupRoute } from "routes";
import { theme } from "theme";
import useIsMobile from "utils/useIsMobile";

import CouchersMission from "./CouchersMission";
import HeroSection from "./HeroSection";
import MapSection from "./MapSection";
import SocialProof from "./SocialProof";
import WhyCouchersSection from "./WhyCouchersSection";

const StyledSpacer = styled("div")(({ theme }) => ({
  height: "3.5rem",
}));

export default function LandingPage() {
  const { authState } = useAuthContext();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { t } = useTranslation(GLOBAL);

  // This makes sure anything didn't get cleared up in the query cache in the Logout
  // component definitely gets cleared here when redirected to the landing page
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!authState.authenticated) {
      queryClient.clear();
    }
  }, [queryClient, authState.authenticated]);

  return (
    <>
      <HtmlMeta />
      <Container component="section" maxWidth="lg">
        <HeroSection />
      </Container>
      <StyledSpacer />
      <Container
        component="section"
        disableGutters
        maxWidth={false}
        sx={{
          display: "flex",
          justifyContent: "center",
          backgroundColor: "var(--mui-palette-grey-50)",
        }}
      >
        <SocialProof />
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="lg">
        <WhyCouchersSection />
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="lg">
        <MapSection />
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="lg">
        <CouchersMission />
      </Container>
      {isMobile && !authState.authenticated && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "var(--mui-palette-background-paper)",
            padding: theme.spacing(2),
            boxShadow: theme.shadows[1],
            zIndex: 10,
          }}
        >
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{ fontSize: "1.3rem", borderRadius: theme.spacing(1) }}
            onClick={() => router.push(signupRoute)}
          >
            {t("join_us")}
          </Button>
        </Box>
      )}
    </>
  );
}
