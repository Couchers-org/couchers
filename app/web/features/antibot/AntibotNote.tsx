import StyledLink from "@/components/StyledLink";

const AntibotNote = () => {
  return (
    <>
      This site is protected by reCAPTCHA and the Google{" "}
      <StyledLink target="_blank" href="https://policies.google.com/privacy">
        Privacy Policy
      </StyledLink>{" "}
      and{" "}
      <StyledLink target="_blank" href="https://policies.google.com/terms">
        Terms of Service
      </StyledLink>{" "}
      apply.
    </>
  );
};

export default AntibotNote;
