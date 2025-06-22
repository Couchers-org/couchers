import { Container, styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { useAuthContext } from "features/auth/AuthProvider";
import { useEffect, useRef } from "react";
import { useQueryClient } from "react-query";
import { theme } from "theme";

import CouchersMission from "./CouchersMission";
import HeroSection from "./HeroSection";
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

  const moreContentRef = useRef<HTMLHeadingElement>(null);

  const scrollToMore = () => {
    setTimeout(() => {
      moreContentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  return (
    <>
      <HtmlMeta />
      <Container component="section" maxWidth="lg">
        <HeroSection scrollToMore={scrollToMore} />
      </Container>
      <StyledSpacer />
      <Container
        component="section"
        maxWidth="lg"
        ref={moreContentRef}
      ></Container>
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
        Fourth section here
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="lg">
        <CouchersMission />
      </Container>
    </>
  );
}
