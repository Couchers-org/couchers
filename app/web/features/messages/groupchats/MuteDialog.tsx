import {
  DialogProps,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
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
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import dayjs from "utils/dayjs";

type DurationChoice = "1h" | "8h" | "1d" | "1w" | "1m" | "forever";

export default function MuteDialog({
  groupChatId,
  ...props
}: DialogProps & { groupChatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const queryClient = useQueryClient();
  const muteMutation = useMutation<void, RpcError, DurationChoice>(
    async (duration) => {
      let d = null;
      if (duration === "1h") d = dayjs.duration({ hours: 1 });
      else if (duration === "8h") d = dayjs.duration({ hours: 8 });
      else if (duration === "1d") d = dayjs.duration({ days: 1 });
      else if (duration === "1w") d = dayjs.duration({ weeks: 1 });
      else if (duration === "1m") d = dayjs.duration({ months: 1 });
      await service.conversations.muteChat({
        groupChatId,
        forDuration: d ?? undefined,
        forever: !d,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatsListKey);
        queryClient.invalidateQueries(groupChatKey(groupChatId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );

  const [selected, setSelected] = useState<DurationChoice | undefined>(
    undefined
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
        <FormControl component="fieldset">
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
          loading={muteMutation.isLoading}
        >
          {t("global:cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          loading={muteMutation.isLoading}
          disabled={!selected}
        >
          {t("messages:chat_view.mute.button_label")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
