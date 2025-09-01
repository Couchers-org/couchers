import { ContentCopy } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { ListInviteCodesRes } from "proto/account_pb";
import React from "react";
import { inviteRoute } from "routes";
import { service } from "service";

export default function InviteCodesPage() {
  const { t } = useTranslation(GLOBAL);
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<
    ListInviteCodesRes.AsObject,
    RpcError,
    ListInviteCodesRes.AsObject
  >({
    queryKey: ["inviteCodes"],
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inviteCodes"] }),
  });

  const { isPending: isDisablePending, mutate: disableInviteCode } =
    useMutation({
      mutationFn: (code: string) => service.account.disableInviteCode(code),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["inviteCodes"] }),
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
        {t("global:nav.invite_members", "Invite members")}
      </Typography>

      <Typography color="textSecondary" sx={{ mb: 3 }}>
        {t("invites.instructions")}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => createInviteCode()}
          disabled={isCreatePending}
        >
          {t("global:create", "Create")}
        </Button>
      </Box>

      {error && <Alert severity="error">{error.message}</Alert>}

      {isLoading ? (
        <Typography>{t("global:loading", "Loading...")}</Typography>
      ) : (
        <List>
          {(data?.inviteCodesList ?? []).map((c) => {
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
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
                      title={t("global:copied")}
                      placement="top"
                      arrow
                    >
                      <IconButton
                        edge="end"
                        aria-label="copy"
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
                        {t("global:disable", "Disable")}
                      </Button>
                    )}
                  </>
                }
              >
                <ListItemText
                  primary={`${c.code}`}
                  sx={c.disabled ? { color: "text.disabled" } : undefined}
                  secondary={
                    <>
                      {c.created?.seconds && (
                        <>
                          {t("global:created", "Created")}:{" "}
                          {dayjs(new Date(c.created.seconds * 1000)).format(
                            "YYYY-MM-DD HH:mm",
                          )}
                        </>
                      )}
                      {c.disabled?.seconds && (
                        <>
                          {" • "}
                          {t("global:disabled", "Disabled")}:{" "}
                          {dayjs(new Date(c.disabled.seconds * 1000)).format(
                            "YYYY-MM-DD HH:mm",
                          )}
                        </>
                      )}
                      {typeof c.uses === "number" && (
                        <>
                          {" • "}
                          {t("global:uses")}: {c.uses}{" "}
                          {t("invites.uses_suffix")}
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            );
          })}
          {!(data?.inviteCodesList?.length ?? 0) && (
            <Typography color="textSecondary">{t("global:empty")}</Typography>
          )}
        </List>
      )}
    </Box>
  );
}
