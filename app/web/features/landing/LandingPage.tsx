import { Container, styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { useAuthContext } from "features/auth/AuthProvider";
import { useEffect } from "react";
import { useQueryClient } from "react-query";
import { theme } from "theme";

import CouchersMission from "./CouchersMission";
import MapSection from "./MapSection";
import SocialProof from "./SocialProof";
import WhyCouchersSection from "./WhyCouchersSection";

const StyledSpacer = styled("div")(({ theme }) => ({
  height: theme.spacing(4),
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
      Signup section here
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
        Third section here
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
