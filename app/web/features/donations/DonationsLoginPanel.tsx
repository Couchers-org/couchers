import { Link, styled, Typography } from "@mui/material";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { DONATIONS } from "i18n/namespaces";
import NextLink from "next/link";
import { donationsRoute, loginRoute, signupRoute } from "routes";
import { theme } from "theme";

import { ANONYMOUS_DONATION_MIN_AMOUNT, SUPPORT_EMAIL } from "./constants";

const StyledPanel = styled("div")(() => ({
  padding: theme.spacing(2),
  border: `2px solid var(--mui-palette-grey-200)`,
  borderRadius: theme.shape.borderRadius * 2,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledLoginButton = styled(Button)(() => ({
  backgroundColor: "var(--mui-palette-primary-main)",
  borderRadius: "0.5rem",
  boxShadow: "initial",
  height: "2.75rem",
  "&:hover": {
    opacity: 0.4,
    backgroundColor: "var(--mui-palette-primary-main)",
  },
  "& .MuiButton-label": {
    color: "var(--mui-palette-background-paper)",
  },
  color: "var(--mui-palette-background-paper)",
  fontWeight: 700,
  alignSelf: "stretch",
}));

export default function DonationsLoginPanel() {
  const { t } = useTranslation(DONATIONS);

  return (
    <StyledPanel>
      <Typography variant="h3">{t("logged_out.title")}</Typography>
      <Typography variant="body2">{t("logged_out.body")}</Typography>
      <StyledLoginButton
        component={NextLink}
        href={{
          pathname: loginRoute,
          query: { from: donationsRoute },
        }}
      >
        {t("logged_out.login_button")}
      </StyledLoginButton>
      <Typography variant="body2">
        <Trans
          t={t}
          i18nKey="logged_out.signup_prompt"
          components={{
            signupLink: <StyledLink href={signupRoute} />,
          }}
        />
      </Typography>
      <Typography variant="body2">
        <Trans
          t={t}
          i18nKey="logged_out.anonymous_donation"
          components={{
            emailLink: <Link href={`mailto:${SUPPORT_EMAIL}`} underline="hover" />,
          }}
          values={{
            amount: ANONYMOUS_DONATION_MIN_AMOUNT,
            email: SUPPORT_EMAIL,
          }}
        />
      </Typography>
    </StyledPanel>
  );
}
