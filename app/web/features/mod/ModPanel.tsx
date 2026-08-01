import { styled, Typography } from "@mui/material";
import Divider from "components/Divider";
import LabelAndText from "components/LabelAndText";
import StyledLink from "components/StyledLink";
import { UserDetails } from "couchers/proto/admin_pb";
import { User } from "couchers/proto/api_pb";
import { useTranslation } from "i18n";
import { GLOBAL, MOD } from "i18n/namespaces";

interface ModPanelProps {
  user: User.AsObject;
  userDetails: UserDetails.AsObject;
}

const StyledWrapper = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const StyledStrongStatus = styled("b")(({ theme }) => ({
  color: "red",
  textTransform: "uppercase",
}));

export default function ModPanel({ userDetails }: ModPanelProps) {
  const { t } = useTranslation([GLOBAL, MOD]);
  return (
    <StyledWrapper>
      <Typography variant="h1">{t("mod:panel.heading")}</Typography>
      <LabelAndText
        label={t("mod:panel.username")}
        text={<code>@{userDetails.username}</code>}
      />
      <LabelAndText
        label={t("mod:panel.user_id")}
        text={<code>{userDetails.userId}</code>}
      />
      <LabelAndText
        label={t("mod:panel.email")}
        text={
          <StyledLink href={"mailto:" + userDetails.email}>
            <code>{userDetails.email}</code>
          </StyledLink>
        }
      />
      <LabelAndText
        label={t("mod:panel.birthdate")}
        text={<code>{userDetails.birthdate}</code>}
      />
      <LabelAndText
        label={t("mod:banned")}
        text={
          userDetails.banned ? (
            <StyledStrongStatus>{t("mod:banned")}</StyledStrongStatus>
          ) : (
            t("global:no")
          )
        }
      />
      <LabelAndText
        label={t("mod:deleted")}
        text={
          userDetails.deleted ? (
            <StyledStrongStatus>{t("mod:deleted")}</StyledStrongStatus>
          ) : (
            t("global:no")
          )
        }
      />
      <LabelAndText
        label={t("mod:do_not_email")}
        text={
          userDetails.doNotEmail ? (
            <StyledStrongStatus>{t("mod:do_not_email")}</StyledStrongStatus>
          ) : (
            t("global:no")
          )
        }
      />
      <LabelAndText
        label={t("mod:panel.has_strong_verification")}
        text={
          userDetails.hasStrongVerification ? t("global:yes") : t("global:no")
        }
      />
      <LabelAndText
        label={t("mod:panel.birthdate_verification_status")}
        text={userDetails.birthdateVerificationStatus}
      />
      <LabelAndText
        label={t("mod:panel.gender_verification_status")}
        text={userDetails.genderVerificationStatus}
      />
      <LabelAndText
        label={t("mod:panel.has_passport_sex_gender_exception")}
        text={
          userDetails.hasPassportSexGenderException
            ? t("global:yes")
            : t("global:no")
        }
      />
      <LabelAndText
        label={t("mod:panel.pending_mod_notes_count")}
        text={userDetails.pendingModNotesCount}
      />
      <LabelAndText
        label={t("mod:panel.acknowledged_mod_notes_count")}
        text={userDetails.acknowledgedModNotesCount}
      />
      <StyledDivider />
    </StyledWrapper>
  );
}
