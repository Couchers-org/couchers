import { ContentCopy } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { localizeDateTime } from "i18n/datetimes";
import { GLOBAL } from "i18n/namespaces";
import { ListInviteCodesRes } from "proto/account_pb";
import React from "react";
import { inviteRoute } from "routes";
import { service } from "service";
import { timestampToPlainDateTime } from "utils/date";

import { inviteCodesKey } from "../queryKeys";

export default function InviteCodesPage() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(GLOBAL);
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<ListInviteCodesRes.AsObject, RpcError, ListInviteCodesRes.AsObject>({
    queryKey: [inviteCodesKey],
    queryFn: service.account.listInviteCodes,
    select: (res) => ({
      ...res,
      inviteCodesList: [...(res.inviteCodesList ?? [])].sort(
        (a, b) => (b.created?.seconds ?? 0) - (a.created?.seconds ?? 0),
      ),
    }),
  });

  const { isPending: isCreatePending, mutate: createInviteCode } = useMutation({
    mutationFn: service.account.createInviteCode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [inviteCodesKey] }),
  });

  const { isPending: isDisablePending, mutate: disableInviteCode } = useMutation({
    mutationFn: (code: string) => service.account.disableInviteCode(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [inviteCodesKey] }),
  });

  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const copiedTimerRef = React.useRef<number | null>(null);

  const copy = async (url: string, code: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    if (copiedTimerRef.current) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopiedCode(null);
      copiedTimerRef.current = null;
    }, 1500);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 800, mx: "auto", mt: 6, px: 2 }}>
      <Typography variant="h2" gutterBottom sx={{ mb: 1 }}>
        {t("global:invites.title")}
      </Typography>

      <Typography color="textSecondary" sx={{ mb: 3 }}>
        {t("global:invites.instructions")}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button variant="contained" onClick={() => createInviteCode()} disabled={isCreatePending}>
          {t("global:create")}
        </Button>
      </Box>

      {error && <Alert severity="error">{error.message}</Alert>}

      {isLoading ? (
        <List>
          {[0, 1].map((i) => (
            <ListItem
              key={`sk-${i}`}
              divider
              secondaryAction={<Skeleton variant="circular" sx={{ width: 24, height: 24 }} />}
            >
              <ListItemText
                primary={<Skeleton variant="text" sx={{ width: "15%" }} />}
                secondary={<Skeleton variant="text" sx={{ width: "50%" }} />}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <List>
          {(data?.inviteCodesList ?? []).map((c) => {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const shareUrl = `${origin}${inviteRoute}?code=${c.code}`;
            return (
              <ListItem
                key={c.code}
                divider
                sx={c.disabled ? { opacity: 0.6 } : undefined}
                secondaryAction={
                  <>
                    <Tooltip
                      open={copiedCode === c.code}
                      title={t("global:copy_button.copied_tooltip")}
                      placement="top"
                      arrow
                    >
                      <IconButton
                        edge="end"
                        aria-label={t("global:copy_button.a11y")}
                        onClick={() => copy(shareUrl, c.code)}
                        disabled={!!c.disabled}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    {!c.disabled && (
                      <Button
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => disableInviteCode(c.code)}
                        disabled={isDisablePending}
                      >
                        {t("global:invites.disable_link")}
                      </Button>
                    )}
                  </>
                }
              >
                <ListItemText
                  primary={<span data-testid="invite-code-link">{shareUrl}</span>}
                  sx={c.disabled ? { color: "text.disabled" } : undefined}
                  secondary={
                    <>
                      {c.created?.seconds && (
                        <>
                          {t("global:invites.created_datetime", {
                            datetime: localizeDateTime(timestampToPlainDateTime(c.created), {
                              locale: locale,
                              abbreviate: true,
                            }),
                          })}
                        </>
                      )}
                      {c.disabled?.seconds && (
                        <>
                          {" • "}
                          {t("global:invites.disabled_datetime", {
                            datetime: localizeDateTime(timestampToPlainDateTime(c.disabled), {
                              locale,
                              abbreviate: true,
                            }),
                          })}
                        </>
                      )}
                      {typeof c.uses === "number" && (
                        <>
                          {" • "}
                          {t("global:invites.number_of_uses", {
                            count: c.uses,
                          })}
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            );
          })}
          {!(data?.inviteCodesList?.length ?? 0) && (
            <Typography color="textSecondary">{t("global:invites.no_codes_message")}</Typography>
          )}
        </List>
      )}
    </Box>
  );
}
