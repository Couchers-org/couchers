import { Container, styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { useAuthContext } from "features/auth/AuthProvider";
import mobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import Signup from "features/auth/signup/Signup";
import { useEffect, useRef } from "react";
import { useQueryClient } from "react-query";

const StyledSection = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2, 16),
  paddingBottom: 0,
  background: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${mobileAuthBg.src}")`,
  backgroundPosition: "top center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  width: "100%",
  height: `calc(100vh - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1, 2),
    justifyContent: "center",
  },
}));

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
      <StyledSection>
        <Signup scrollToMore={scrollToMore} />
      </StyledSection>
      <StyledSpacer />
      <Container component="section" maxWidth="md" ref={moreContentRef}>
        First section Here
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        Second section here
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        Third section here
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        Fourth section here
      </Container>
      <StyledSpacer />
      <Container component="section" maxWidth="md">
        Fifth section here
      </Container>
    </>
  );
}
