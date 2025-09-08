import { Link, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import StyledLink from "@/components/StyledLink";
import AntibotNote from "@/features/antibot/AntibotNote";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import log from "@/log";
import { GetSignupPageInfoRes } from "@/proto/public_pb";
import { BASE_ROUTE, TOS_ROUTE } from "@/routes";

import AccountForm from "./AccountForm";
import BasicForm from "./BasicForm";
import CommunityGuidelinesForm from "./CommunityGuidelinesForm";
import ResendVerificationEmailForm from "./ResendVerificationEmailForm";

const SignupFormContent = () => {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const state = authState.flowState;

  const [signupInfo, setSignupInfo] =
    useState<GetSignupPageInfoRes.AsObject | null>(null);

  useEffect(() => {
    const fetchSignupInfo = async () => {
      try {
        const response = await fetch(
          "https://couchers.org/api/public/signup-page-info",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch signup info");
        }
        const data = (await response.json()) as GetSignupPageInfoRes.AsObject;
        setSignupInfo(data);
      } catch (error) {
        log.error("Error fetching signup info:", error);
      }
    };

    void fetchSignupInfo();
  }, []);

  if (!state || state.needBasic) {
    return (
      <>
        <Typography
          gutterBottom
          sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
        >
          {t("landing:signup_header")}
        </Typography>
        <Typography gutterBottom sx={{ marginBottom: 2 }}>
          <Trans
            i18nKey="landing:signup_description"
            values={{
              user_count: signupInfo?.userCount
                ? signupInfo.userCount.toLocaleString()
                : "56k+",
            }}
            components={{
              2: <Link href={BASE_ROUTE} underline="hover" />,
            }}
          >
            Travel, host, and connect with{" "}
            {{ user_count: signupInfo?.userCount || "56k" }} members.{" "}
            <StyledLink href={BASE_ROUTE}>Learn more about us</StyledLink>.
          </Trans>
        </Typography>
        <BasicForm submitText={t("global:create_account")} />
        <Typography variant="caption">
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink
              href={TOS_ROUTE}
              target="_blank"
              variant="caption"
              sx={{ fontWeight: 700 }}
            >
              Terms of Service
            </StyledLink>
            , including our cookie, email, and data handling policies.
          </Trans>{" "}
          <AntibotNote />
        </Typography>
      </>
    );
  } else if (state.needAccount) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:account_form.header")}
        </Typography>
        <AccountForm />
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:community_guidelines_form.header")}
        </Typography>
        <CommunityGuidelinesForm />
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:sign_up_need_verification_title")}
        </Typography>
        <ResendVerificationEmailForm />
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:sign_up_completed_title")}
        </Typography>
        <Typography variant="body1">
          {t("auth:sign_up_confirmed_prompt")}
        </Typography>
      </>
    );
  } else {
    throw Error(t("auth:unhandled_sign_up_state"));
  }
};

export default SignupFormContent;
