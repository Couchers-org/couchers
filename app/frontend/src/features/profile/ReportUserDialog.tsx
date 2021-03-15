import { DialogProps } from "@material-ui/core";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service/index";
import type { ReportUserInput } from "service/user";

import {
  CANCEL,
  getReportDialogTitle,
  REPORT_DETAILS,
  REPORT_REASON,
  SEND,
} from "./constants";

const REPORT_USER_DIALOG_LABEL_ID = "report-user-dialog-title";

type ReportUserFormData = Omit<ReportUserInput, "userId">;

export default function ReportUserDialog({ onClose, open }: DialogProps) {
  const { handleSubmit, register } = useForm<ReportUserFormData>();

  const { mutate: reportUser } = useMutation<
    Empty,
    GrpcError,
    ReportUserFormData
  >(({ description, reason }) =>
    service.user.reportUser({ description, reason, userId: 1 })
  );

  const onSubmit = handleSubmit(({ description, reason }) => {
    // trigger mutation
    reportUser({ description, reason });
  });

  return (
    <Dialog aria-labelledby={REPORT_USER_DIALOG_LABEL_ID} open={open}>
      <form onSubmit={onSubmit}>
        <DialogTitle id={REPORT_USER_DIALOG_LABEL_ID}>
          {getReportDialogTitle("Itsi")}
        </DialogTitle>
        <DialogContent>
          <TextField
            id="user-report-reason"
            inputRef={register({ required: true })}
            label={REPORT_REASON}
            name="reason"
            fullWidth
          />
          <TextField
            fullWidth
            id="user-report-details"
            inputRef={register({ required: true })}
            label={REPORT_DETAILS}
            multiline
            name="description"
            rowsMax={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onSubmit} type="submit">
            {SEND}
          </Button>
          <Button
            onClick={() => {
              onClose?.({}, "escapeKeyDown");
            }}
          >
            {CANCEL}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
