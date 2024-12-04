import {
  Card,
  CardActions,
  CardContent,
  styled,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  CalendarIcon,
  ClockIcon,
  InfoIcon,
  LocationIcon,
} from "components/Icons";
import IconText from "components/IconText";
import { activeLoginsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { Trans } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { ActiveSession } from "proto/account_pb";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import { dateFormatter, dateTimeFormatter, timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export default function LoginsPage({
  session,
}: {
  session: ActiveSession.AsObject;
}) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, AUTH]);

  const lastSeenDisplay = timeAgoI18n({
    input: timestamp2Date(session.lastSeen!),
    t: t,
  });
  const createdDisplay = dateTimeFormatter(locale).format(
    timestamp2Date(session.created!)
  );
  const expiryDisplay = dateFormatter(locale).format(
    timestamp2Date(session.expiry!)
  );
  const queryClient = useQueryClient();

  const {
    error,
    isLoading,
    mutate: logOutThisSession,
  } = useMutation<void, RpcError>(
    async () => {
      await service.account.logOutSession(session.created!);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(activeLoginsKey);
      },
    }
  );

  return (
    <StyledCard>
      <CardContent>
        <Typography variant="h2">
          <Trans t={t} i18nKey="auth:active_logins.login_header">
            Login on {{ login_datetime: createdDisplay }}
          </Trans>
        </Typography>
        {error && <Alert severity="error">{error.message}</Alert>}
        <IconText
          icon={LocationIcon}
          text={
            <Trans t={t} i18nKey="auth:active_logins.location">
              Near{" "}
              <strong>
                {{ approximate_location: session.approximateLocation }}
              </strong>
            </Trans>
          }
        />
        <IconText
          icon={ClockIcon}
          text={
            <Trans t={t} i18nKey="auth:active_logins.last_activity">
              Last activity{" "}
              <strong>{{ last_activity_ago: lastSeenDisplay }}</strong>
            </Trans>
          }
        />
        <IconText
          icon={CalendarIcon}
          text={
            <Trans t={t} i18nKey="auth:active_logins.expiry">
              Expires on <strong>{{ expiry_datetime: expiryDisplay }}</strong>
            </Trans>
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
          <Button onClick={() => logOutThisSession()} loading={isLoading}>
            {t("auth:active_logins.log_out_of_session")}
          </Button>
        </CardActions>
      )}
    </StyledCard>
  );
}
