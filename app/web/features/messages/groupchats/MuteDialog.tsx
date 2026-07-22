import {
  DialogProps,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import { groupChatKey, groupChatsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import React, { useState } from "react";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import { approxTimeDuration } from "utils/date";

type DurationChoice = "1h" | "8h" | "1d" | "1w" | "1m" | "forever";

export default function MuteDialog({
  groupChatId,
  ...props
}: DialogProps & { groupChatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const queryClient = useQueryClient();
  const muteMutation = useMutation<void, RpcError, DurationChoice>({
    mutationFn: async (duration) => {
      let d;
      if (duration === "1h") d = Temporal.Duration.from({ hours: 1 });
      else if (duration === "8h") d = Temporal.Duration.from({ hours: 8 });
      else if (duration === "1d") d = Temporal.Duration.from({ days: 1 });
      else if (duration === "1w") d = Temporal.Duration.from({ weeks: 1 });
      else if (duration === "1m") d = Temporal.Duration.from({ months: 1 });
      await service.conversations.muteChat({
        groupChatId,
        forDuration: d ? approxTimeDuration(d) : undefined,
        forever: !d,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [groupChatsListKey] });
      queryClient.invalidateQueries({
        queryKey: [groupChatKey(groupChatId)],
      });
      if (props.onClose) props.onClose({}, "escapeKeyDown");
    },
  });

  const [selected, setSelected] = useState<DurationChoice | undefined>(
    undefined,
  );

  const handleSubmit = () => (selected ? muteMutation.mutate(selected) : null);

  return (
    <Dialog {...props} aria-labelledby="mute-dialog-title">
      <DialogTitle id="mute-dialog-title">
        {t("messages:chat_view.mute.dialog_title")}
      </DialogTitle>
      <DialogContent>
        {muteMutation.error && (
          <Alert severity="error">{muteMutation.error.message}</Alert>
        )}
        <FormControl variant="standard" component="fieldset">
          <RadioGroup
            aria-labelledby="mute-dialog-title"
            value={selected ?? null}
            onChange={(e, val) => setSelected(val as DurationChoice)}
          >
            <FormControlLabel
              value="1h"
              control={<Radio />}
              label={t("messages:chat_view.mute.1_hour_label")}
            />
            <FormControlLabel
              value="8h"
              control={<Radio />}
              label={t("messages:chat_view.mute.8_hours_label")}
            />
            <FormControlLabel
              value="1d"
              control={<Radio />}
              label={t("messages:chat_view.mute.1_day_label")}
            />
            <FormControlLabel
              value="1w"
              control={<Radio />}
              label={t("messages:chat_view.mute.1_week_label")}
            />
            <FormControlLabel
              value="1m"
              control={<Radio />}
              label={t("messages:chat_view.mute.1_month_label")}
            />
            <FormControlLabel
              value="forever"
              control={<Radio />}
              label={t("messages:chat_view.mute.forever_label")}
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={muteMutation.isPending}
        >
          {t("global:cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          loading={muteMutation.isPending}
          disabled={!selected}
        >
          {t("messages:chat_view.mute.button_label")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
