import StyledLink from "components/StyledLink";

export default function AntibotNote() {
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
}
