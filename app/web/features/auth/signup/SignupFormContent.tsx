import { Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import AntibotNote from "features/antibot/AntibotNote";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetSignupPageInfoRes } from "proto/public_pb";
import { useEffect, useState } from "react";
import { missionRoute, tosRoute } from "routes";

import { useIsNativeEmbed } from "../../../utils/nativeLink";
import { useAuthContext } from "../AuthProvider";
import AccountForm from "./AccountForm";
import BasicForm from "./BasicForm";
import CommunityGuidelinesForm from "./CommunityGuidelinesForm";
import IntentsForm from "./IntentsForm";
import ResendVerificationEmailForm from "./ResendVerificationEmailForm";

export default function SignupFormContent({
  inviteCode,
}: {
  inviteCode?: string;
}) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const state = authState.flowState;
  const isNativeEmbed = useIsNativeEmbed();

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
        const data = await response.json();
        setSignupInfo(data);
      } catch (error) {
        console.error("Error fetching signup info:", error);
      }
    };

    fetchSignupInfo();
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
            i18nKey={
              isNativeEmbed
                ? "landing:signup_description_no_link"
                : "landing:signup_description"
            }
            values={{
              user_count: signupInfo?.userCount
                ? Number(signupInfo.userCount).toLocaleString()
                : "65k+",
            }}
            components={
              isNativeEmbed
                ? {}
                : {
                    2: <StyledLink href={missionRoute} />,
                  }
            }
          />
        </Typography>
        <BasicForm
          inviteCode={inviteCode}
          submitText={t("global:create_account")}
        />
        <Typography variant="caption">
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink
              href={tosRoute}
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
  } else if (state.needIntents) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:intents_form.header")}
        </Typography>
        <IntentsForm />
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
}
