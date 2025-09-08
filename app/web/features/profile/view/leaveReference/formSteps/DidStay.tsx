import { Alert, Box, styled, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import Button from "@/components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@/components/Dialog";
import StyledLink from "@/components/StyledLink";
import TextBody from "@/components/TextBody";
import TextField from "@/components/TextField";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { ReferenceStepProps } from "@/features/profile/view/leaveReference/ReferenceForm";
import { Trans, useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { ReferenceType } from "@/proto/references_pb";
import {
  BASE_ROUTE,
  HELP_CENTER_REPORT_CONTENT_URL,
  LEAVE_REFERENCE_BASE_ROUTE,
  REFERENCE_STEP_STRINGS,
  REFERENCE_TYPE_ROUTE,
} from "@/routes";
import { indicateDidntMeetup } from "@/service/references";
import { theme } from "@/theme";

import ReferenceStepHeader from "./ReferenceStepHeader";

interface IndicateDidntMeetupFormData {
  didStay: boolean;
  reasonDidntMeetup: string;
}

const StyledForm = styled("form")(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledTextBody = styled(TextBody)(({ theme }) => ({
  "& > .MuiInputBase-root": {
    width: "100%",
  },
  marginTop: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    "& > .MuiInputBase-root": {
      width: 400,
    },
  },
}));

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(1),
}));

const StyledReasonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(3),
  width: "100%",
}));

const DidStay = ({
  referenceData,
  referenceType,
  hostRequestId,
  setReferenceValues,
}: ReferenceStepProps) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [didSubmitNotStay, setDidSubmitNotStay] = useState(false);
  const [
    isDidNotStayConfirmationDialogOpen,
    setIsDidNotStayConfirmationDialogOpen,
  ] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IndicateDidntMeetupFormData>();

  const { didStay, reasonDidntMeetup } = watch();

  const onSubmitDidNotStay = handleSubmit(async () => {
    if (!didStay && hostRequestId && reasonDidntMeetup) {
      await indicateDidntMeetup({
        hostRequestId,
        reasonDidntMeetup,
      });

      setReferenceValues({ ...referenceData, didStay: false });
      setDidSubmitNotStay(true);
    }
  });

  const handleDidStay = (event: React.MouseEvent) => {
    event.preventDefault();
    setReferenceValues({ ...referenceData, didStay: true });
    setValue("didStay", true);

    if (
      referenceType ===
      REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      void router.push(
        `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${user.userId}/${REFERENCE_STEP_STRINGS[1]}`,
      );
    } else {
      // TODO(FB) Handle undefined hostRequestId properly
      void router.push(
        `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${user.userId}/${hostRequestId ?? 0}/${REFERENCE_STEP_STRINGS[1]}`,
      );
    }
  };

  const handleDidNotStayClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setReferenceValues({ ...referenceData, didStay: false });
    setValue("didStay", false);
  };

  const handleOpenConfirmationDialog = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDidNotStayConfirmationDialogOpen(true);
  };

  const handleCloseConfirmationDialog = () => {
    setIsDidNotStayConfirmationDialogOpen(false);
  };

  if (didSubmitNotStay) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <Alert severity="success">
          {t("profile:leave_reference.didnt_meetup_submit_success")}
        </Alert>
        <Button
          variant="contained"
          type="submit"
          size="large"
          sx={{ marginTop: 2 }}
          onClick={() => {
            void router.push(BASE_ROUTE);
          }}
        >
          {t("profile:leave_reference.go_to_dashboard")}
        </Button>
      </Box>
    );
  }

  return (
    <>
      <StyledForm>
        <ReferenceStepHeader
          name={user.name}
          referenceType={referenceType}
          isDidStayStep
        />
        <StyledButtonContainer>
          <Button
            variant="outlined"
            type="submit"
            size="large"
            sx={{ marginTop: 2, marginRight: 2 }}
            onClick={handleDidNotStayClick}
          >
            {t("global:no")}
          </Button>
          <Button
            variant="contained"
            type="submit"
            size="large"
            sx={{ marginTop: 2 }}
            onClick={handleDidStay}
          >
            {t("global:yes")}
          </Button>
        </StyledButtonContainer>
        <StyledTextBody sx={{ marginTop: theme.spacing(3) }}>
          <Trans
            i18nKey="profile:leave_reference.did_stay_explanation"
            components={{ bold: <strong /> }}
          />
        </StyledTextBody>
        {!didStay && (
          <StyledReasonContainer>
            <Controller
              control={control}
              name="reasonDidntMeetup"
              render={({ field }) => (
                <TextField
                  {...field}
                  id="reasonDidntMeetup"
                  label={t("profile:leave_reference.reason_didnt_meetup")}
                  error={!!errors.reasonDidntMeetup}
                  helperText={errors.reasonDidntMeetup?.message}
                  onChange={field.onChange}
                  value={field.value}
                  multiline
                  minRows={5}
                  sx={{
                    "& > .MuiInputBase-root": {
                      width: "100%",
                      marginTop: theme.spacing(1),
                    },
                  }}
                />
              )}
            />
            <StyledButtonContainer>
              <Button
                fullWidth={isMobile}
                onClick={handleOpenConfirmationDialog}
              >
                {t("global:submit")}
              </Button>
            </StyledButtonContainer>
          </StyledReasonContainer>
        )}
      </StyledForm>
      <Dialog
        aria-labelledby="did-stay--no-dialog-title"
        open={isDidNotStayConfirmationDialogOpen}
        onClose={handleCloseConfirmationDialog}
      >
        <DialogTitle id="did-stay--no-dialog-title">
          {referenceType ===
          REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_HOSTED]
            ? t("profile:leave_reference.did_stay_confirmation.title_hosted", {
                name: user.name,
              })
            : t("profile:leave_reference.did_stay_confirmation.title_surfed", {
                name: user.name,
              })}
        </DialogTitle>
        <DialogContent>
          <Trans
            i18nKey={
              referenceType ===
              REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_HOSTED]
                ? "profile:leave_reference.did_stay_confirmation.message_hosted"
                : "profile:leave_reference.did_stay_confirmation.message_surfed"
            }
            values={{ name: user.name }}
            components={{
              strong: <strong />,
              2: (
                <StyledLink href={HELP_CENTER_REPORT_CONTENT_URL} target="#" />
              ),
              br: <br />,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCloseConfirmationDialog}>
            {t("global:cancel")}
          </Button>
          <Button variant="contained" onClick={onSubmitDidNotStay}>
            {referenceType ===
            REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_HOSTED]
              ? t(
                  "profile:leave_reference.did_stay_confirmation.confirm_hosted",
                )
              : t(
                  "profile:leave_reference.did_stay_confirmation.confirm_surfed",
                )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DidStay;
