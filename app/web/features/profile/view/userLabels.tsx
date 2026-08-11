import { styled, Tooltip } from "@mui/material";
import { CheckCircleIcon, ErrorIcon } from "components/Icons";
import LabelAndText from "components/LabelAndText";
import RelativeTime from "components/RelativeTime";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { useTranslation } from "i18n";
import { localizeDuration, localizeTimeOnly, localizeTimeZone, localizeYearMonth } from "i18n/datetimes";
import { COMMUNITIES, GLOBAL, PROFILE } from "i18n/namespaces";
import { BirthdateVerificationStatus, GenderVerificationStatus, User } from "proto/api_pb";
import { Trans } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import { timestampToPlainDateTime } from "utils/date";

interface Props {
  user: User.AsObject;
}

export const ReferencesLastActiveLabels = ({ user }: Props) => {
  const { t } = useTranslation(PROFILE);
  return (
    <>
      <LabelAndText label={t("heading.references")} text={`${user.numReferences || 0}`} />
      <LabelAndText
        label={t("heading.last_active")}
        text={
          user.lastActive ? (
            <RelativeTime instant={user.lastActive} smallestUnit="hours" capitalize={true} />
          ) : (
            t("last_active_false")
          )
        }
      />
    </>
  );
};

export const ResponseRateText = ({
  user,
}: {
  user: Pick<User.AsObject, "insufficientData" | "low" | "some" | "most" | "almostAll">;
}) => {
  const { t } = useTranslation([PROFILE]);

  let rateText = undefined;

  if (user.insufficientData) {
    rateText = t("response_rate_text_insufficient");
  } else if (user.low) {
    rateText = t("response_rate_text_low");
  } else if (user.some) {
    rateText = t("response_rate_text_some");
  } else if (user.most) {
    rateText = t("response_rate_text_most");
  } else if (user.almostAll) {
    rateText = t("response_rate_text_almost_all");
  }

  return <>{rateText}</>;
};

export const ResponseRateLabel = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(PROFILE);
  let rateText = undefined;
  let timeText = undefined;

  if (user.insufficientData) {
    rateText = t("response_rate_text_insufficient");
  } else if (user.low) {
    rateText = t("response_rate_text_low");
  } else if (user.some) {
    rateText = t("response_rate_text_some");
    timeText = t("response_time_text_some", {
      p33: localizeDuration(Temporal.Duration.from({ seconds: user.some.responseTimeP33!.seconds }), locale),
    });
  } else if (user.most) {
    rateText = t("response_rate_text_most");
    timeText = t("response_time_text_most", {
      p33: localizeDuration(Temporal.Duration.from({ seconds: user.most.responseTimeP33!.seconds }), locale),
      p66: localizeDuration(Temporal.Duration.from({ seconds: user.most.responseTimeP66!.seconds }), locale),
    });
  } else if (user.almostAll) {
    rateText = t("response_rate_text_almost_all");
    timeText = t("response_time_text_almost_all", {
      p33: localizeDuration(
        Temporal.Duration.from({
          seconds: user.almostAll.responseTimeP33!.seconds,
        }),
        locale,
      ),
      p66: localizeDuration(
        Temporal.Duration.from({
          seconds: user.almostAll.responseTimeP66!.seconds,
        }),
        locale,
      ),
    });
  }

  return (
    <>
      <LabelAndText label={t("response_rate_label")} text={rateText ?? ""} />
      {timeText && <LabelAndText label={t("response_time_label")} text={timeText} />}
    </>
  );
};

const StyledContainer = styled("div")(() => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
}));

const styledIcon = <C extends React.ComponentType<React.ComponentProps<C>>>(component: C) => {
  return styled(component)(() => ({
    margin: theme.spacing(0.5),
    alignSelf: "center",
  }));
};

const StyledCheckCircleIcon = styledIcon(CheckCircleIcon);
const StyledErrorIcon = styledIcon(ErrorIcon);

const AgeAndGenderRenderer = ({ user }: Props) => {
  const { birthdateVerificationStatus, genderVerificationStatus, age, gender, pronouns } = user;
  const { t } = useTranslation(PROFILE);

  const getBirthdateVerificationIcon = (status: BirthdateVerificationStatus) => {
    switch (status) {
      case BirthdateVerificationStatus.BIRTHDATE_VERIFICATION_STATUS_VERIFIED:
        return (
          <Tooltip title={t("heading.age_verification_verified")}>
            <StyledCheckCircleIcon color="primary" data-testid="check-circle-icon" fontSize="inherit" />
          </Tooltip>
        );
      case BirthdateVerificationStatus.BIRTHDATE_VERIFICATION_STATUS_MISMATCH:
        return (
          <Tooltip title={t("heading.age_verification_mismatch")}>
            <StyledErrorIcon color="error" data-testid="error-icon" fontSize="inherit" />
          </Tooltip>
        );
      default:
        return <>&nbsp;</>;
    }
  };

  const getGenderVerificationIcon = (status: GenderVerificationStatus) => {
    switch (status) {
      case GenderVerificationStatus.GENDER_VERIFICATION_STATUS_VERIFIED:
        return (
          <Tooltip title={t("heading.gender_verification_verified")}>
            <StyledCheckCircleIcon color="primary" data-testid="check-circle-icon" fontSize="inherit" />
          </Tooltip>
        );
      case GenderVerificationStatus.GENDER_VERIFICATION_STATUS_MISMATCH:
        return (
          <Tooltip title={t("heading.gender_verification_mismatch")}>
            <StyledErrorIcon color="error" data-testid="error-icon" fontSize="inherit" />
          </Tooltip>
        );
      default:
        return <>&nbsp;</>;
    }
  };
  return (
    <StyledContainer>
      <span>{age}</span>
      {getBirthdateVerificationIcon(birthdateVerificationStatus)}
      <span>/&nbsp;</span>
      <span>{gender}</span>
      {getGenderVerificationIcon(genderVerificationStatus)}
      {pronouns && <span>({pronouns.replace(/\s+/g, "")})</span>}
    </StyledContainer>
  );
};

export const AgeGenderLanguagesLabels = ({ user }: Props) => {
  const { t } = useTranslation(PROFILE);
  const { languages } = useLanguages();

  return (
    <>
      <LabelAndText label={t("heading.age_gender")} text={<AgeAndGenderRenderer user={user} />} />
      {languages && (
        <LabelAndText
          label={t("heading.languages_fluent")}
          text={
            user.languageAbilitiesList.map((ability) => languages[ability.code]).join(", ") ||
            t("languages_fluent_false")
          }
        />
      )}
    </>
  );
};

export const RemainingAboutLabels = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);
  return (
    <>
      <LabelAndText label={t("profile:heading.hometown")} text={user.hometown} />
      <LabelAndText label={t("profile:heading.occupation")} text={user.occupation} />
      <LabelAndText label={t("profile:heading.education")} text={user.education} />
      <LabelAndText
        label={t("profile:heading.joined")}
        text={
          user.joined
            ? localizeYearMonth(timestampToPlainDateTime(user.joined), locale, {
                capitalize: true,
              })
            : ""
        }
      />
      {user.timezone ? (
        <LabelAndText
          label={t("profile:heading.local_time")}
          text={
            <Trans
              i18nKey="profile:local_time_with_time_zone_text"
              values={{
                time: localizeTimeOnly(Temporal.Now.plainDateTimeISO(user.timezone), locale),
              }}
              components={{
                timeZone: (
                  <Tooltip
                    title={localizeTimeZone(user.timezone, locale, {
                      short: false,
                      capitalize: true,
                    })}
                    placement="top"
                    arrow
                  >
                    <span>
                      {localizeTimeZone(user.timezone, locale, {
                        short: true,
                      })}
                    </span>
                  </Tooltip>
                ),
              }}
            />
          }
        />
      ) : undefined}
    </>
  );
};
