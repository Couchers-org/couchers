import {
  BoltOutlined,
  ChevronRight,
  EventOutlined,
  ForumOutlined,
  HistoryOutlined,
  HomeOutlined,
  PersonOutlined,
  RateReviewOutlined,
  ScheduleOutlined,
  SchoolOutlined,
  SvgIconComponent,
  Translate,
  WorkOutlined,
} from "@mui/icons-material";
import { Box, styled, Tooltip, Typography } from "@mui/material";
import { CheckCircleIcon, ErrorIcon } from "components/Icons";
import RelativeTime from "components/RelativeTime";
import { useLanguages } from "features/profile/hooks/useLanguages";
import { Trans, useTranslation } from "i18n";
import { localizeDuration, localizeTimeOnly, localizeTimeZone, localizeYearMonth } from "i18n/datetimes";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import Link from "next/link";
import { BirthdateVerificationStatus, GenderVerificationStatus, User } from "proto/api_pb";
import { ReactNode } from "react";
import { routeToUser } from "routes";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import { timestampToPlainDateTime } from "utils/date";

import { Fact, FactGrid } from "./ProfileFacts";

interface Props {
  user: User.AsObject;
}

type ResponseRateUser = Pick<User.AsObject, "insufficientData" | "low" | "some" | "most" | "almostAll">;

function responseRateText(t: TFunction, user: ResponseRateUser) {
  if (user.insufficientData) return t("profile:response_rate_text_insufficient");
  if (user.low) return t("profile:response_rate_text_low");
  if (user.some) return t("profile:response_rate_text_some");
  if (user.most) return t("profile:response_rate_text_most");
  if (user.almostAll) return t("profile:response_rate_text_almost_all");
  return undefined;
}

export const ResponseRateText = ({ user }: { user: ResponseRateUser }) => {
  const { t } = useTranslation([PROFILE]);
  return <>{responseRateText(t, user)}</>;
};

function responseTimeText(t: TFunction, locale: string, user: ResponseRateUser) {
  const duration = (seconds: number) => localizeDuration(Temporal.Duration.from({ seconds }), locale);
  if (user.some) return t("profile:response_time_text_some", { p33: duration(user.some.responseTimeP33!.seconds) });
  if (user.most)
    return t("profile:response_time_text_most", {
      p33: duration(user.most.responseTimeP33!.seconds),
      p66: duration(user.most.responseTimeP66!.seconds),
    });
  if (user.almostAll)
    return t("profile:response_time_text_almost_all", {
      p33: duration(user.almostAll.responseTimeP33!.seconds),
      p66: duration(user.almostAll.responseTimeP66!.seconds),
    });
  return undefined;
}

const InfoRow = ({ icon: Icon, label, children }: { icon: SvgIconComponent; label: string; children: ReactNode }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Icon aria-hidden sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)", flexShrink: 0 }} />
    <Typography component="span" sx={{ flex: 1, whiteSpace: "nowrap" }}>
      {label}
    </Typography>
    <Typography component="span" sx={{ fontWeight: 500, textAlign: "right" }}>
      {children}
    </Typography>
  </Box>
);

export const ActivityFacts = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(PROFILE);
  const rateText = responseRateText(t, user);
  const timeText = responseTimeText(t, locale, user);

  return (
    <>
      <InfoRow icon={RateReviewOutlined} label={t("heading.references")}>
        <Box
          component={Link}
          href={routeToUser(user.username, "references")}
          aria-label={t("reference_amounts.count_references", { count: user.numReferences || 0 })}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            pl: 1,
            pr: 0.25,
            border: "1px solid var(--mui-palette-divider)",
            borderRadius: 1.5,
            color: "inherit",
            textDecoration: "none",
            "&:hover": { background: "var(--mui-palette-action-hover)" },
          }}
        >
          {user.numReferences || 0}
          <ChevronRight aria-hidden sx={{ fontSize: 18, color: "var(--mui-palette-primary-main)" }} />
        </Box>
      </InfoRow>
      <InfoRow icon={HistoryOutlined} label={t("heading.last_active")}>
        {user.lastActive ? <RelativeTime instant={user.lastActive} smallestUnit="hours" /> : t("last_active_false")}
      </InfoRow>
      {rateText && (
        <InfoRow icon={ForumOutlined} label={t("response_rate_label")}>
          {rateText}
        </InfoRow>
      )}
      {timeText && (
        <InfoRow icon={BoltOutlined} label={t("response_time_label")}>
          {timeText}
        </InfoRow>
      )}
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
      <span aria-hidden="true">·&nbsp;</span>
      <span>{gender}</span>
      {getGenderVerificationIcon(genderVerificationStatus)}
      {pronouns && <span style={{ color: "var(--mui-palette-text-secondary)" }}>({pronouns.replace(/\s+/g, "")})</span>}
    </StyledContainer>
  );
};

export const MemberSincePill = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, PROFILE]);
  if (!user.joined) return null;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.25,
        border: "1px solid var(--mui-palette-divider)",
        borderRadius: 999,
        fontSize: "0.8125rem",
        // drops below the heading as a whole on narrow screens rather than wrapping inside
        whiteSpace: "nowrap",
      }}
    >
      <EventOutlined aria-hidden sx={{ fontSize: 16, color: "var(--mui-palette-primary-main)" }} />
      {t("profile:overview_facts.member_since_text", {
        month_and_year: localizeYearMonth(timestampToPlainDateTime(user.joined), locale, { abbreviate: true }),
      })}
    </Box>
  );
};

export const OverviewFacts = ({ user }: Props) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, PROFILE]);
  const { languages } = useLanguages();
  const languageNames = languages ? user.languageAbilitiesList.map((ability) => languages[ability.code]) : [];

  return (
    <FactGrid>
      <Fact icon={PersonOutlined} label={t("profile:heading.age_gender")} wide>
        <AgeAndGenderRenderer user={user} />
      </Fact>
      {languageNames.length > 0 && (
        <Fact icon={Translate} label={t("profile:heading.languages_fluent")} wide>
          <Box
            component="ul"
            aria-label={t("profile:heading.languages_fluent")}
            sx={{ listStyle: "none", m: 0, mt: 0.5, p: 0, display: "flex", flexWrap: "wrap", gap: 0.75 }}
          >
            {languageNames.map((name) => (
              <Box
                key={name}
                component="li"
                sx={{ px: 1, py: 0.25, borderRadius: 1, background: "var(--mui-palette-action-hover)" }}
              >
                {name}
              </Box>
            ))}
          </Box>
        </Fact>
      )}
      {user.hometown && (
        <Fact icon={HomeOutlined} label={t("profile:heading.hometown")}>
          {user.hometown}
        </Fact>
      )}
      {user.occupation && (
        <Fact icon={WorkOutlined} label={t("profile:heading.occupation")}>
          {user.occupation}
        </Fact>
      )}
      {user.education && (
        <Fact icon={SchoolOutlined} label={t("profile:heading.education")}>
          {user.education}
        </Fact>
      )}
      {user.timezone && (
        <Fact icon={ScheduleOutlined} label={t("profile:heading.local_time")}>
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
        </Fact>
      )}
    </FactGrid>
  );
};
