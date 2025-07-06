import { Container, styled } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import HtmlMeta from "components/HtmlMeta";
import { useAuthContext } from "features/auth/AuthProvider";
import { useEffect } from "react";
import { theme } from "theme";

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
          backgroundColor: theme.palette.grey[50],
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
    </>
  );
}
