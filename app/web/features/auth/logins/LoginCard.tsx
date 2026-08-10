import { Card, CardActions, CardContent, styled, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import { CalendarIcon, ClockIcon, InfoIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import { activeLoginsKey } from "features/queryKeys";
import { Trans } from "i18n";
import { localizeDateOnly, localizeDateTime, localizeRelativeTime } from "i18n/datetimes";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { ActiveSession } from "proto/account_pb";
import { service } from "service";
import { timestampToPlainDateTime } from "utils/date";

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export default function LoginsPage({ session }: { session: ActiveSession.AsObject }) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, AUTH]);

  const lastSeenDisplay = localizeRelativeTime(session.lastSeen!, locale);
  const createdDisplay = localizeDateTime(timestampToPlainDateTime(session.created!), locale, {
    includeSeconds: true,
  });
  const expiryDisplay = localizeDateOnly(timestampToPlainDateTime(session.expiry!), locale);
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutate: logOutThisSession,
  } = useMutation({
    mutationFn: async () => {
      await service.account.logOutSession(session.created!);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [activeLoginsKey],
      });
    },
  });

  return (
    <StyledCard>
      <CardContent>
        <Typography variant="h2">{t("auth:active_logins.login_header", { login_datetime: createdDisplay })}</Typography>
        {error && <Alert severity="error">{error.message}</Alert>}
        <IconText
          icon={LocationIcon}
          text={
            <Trans
              t={t}
              i18nKey="auth:active_logins.location"
              values={{ approximate_location: session.approximateLocation }}
              components={{ 2: <strong /> }}
            />
          }
        />
        <IconText
          icon={ClockIcon}
          text={
            <Trans
              t={t}
              i18nKey="auth:active_logins.last_activity"
              values={{ last_activity_ago: lastSeenDisplay }}
              components={{ 2: <strong /> }}
            />
          }
        />
        <IconText
          icon={CalendarIcon}
          text={
            <Trans
              t={t}
              i18nKey="auth:active_logins.expiry"
              values={{ expiry_datetime: expiryDisplay }}
              components={{ 1: <strong /> }}
            />
          }
        />
        <IconText
          icon={InfoIcon}
          text={
            <>
              {session.operatingSystem} / {session.browser} / {session.device}
            </>
          }
        />
        {session.isCurrentSession && (
          <Typography variant="body1">
            <strong>{t("auth:active_logins.current_session")}</strong>
          </Typography>
        )}
      </CardContent>
      {!session.isCurrentSession && (
        <CardActions>
          <Button onClick={() => logOutThisSession()} loading={isPending}>
            {t("auth:active_logins.log_out_of_session")}
          </Button>
        </CardActions>
      )}
    </StyledCard>
  );
}
