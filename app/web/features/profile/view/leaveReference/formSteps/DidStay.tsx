import { Alert, Box, styled } from "@mui/material";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  baseRoute,
  helpCenterReportContentURL,
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";
import { indicateDidntMeetup } from "service/references";
import { theme } from "theme";

import { ReferenceStepProps } from "../ReferenceForm";
import ReferenceStepHeader from "./ReferenceStepHeader";
import useIsMobile from "utils/useIsMobile";

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
  const isMobile = useIsMobile();

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
    if (!didStay && hostRequestId) {
      await indicateDidntMeetup({
        hostRequestId,
        reasonDidntMeetup: reasonDidntMeetup || "",
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
      referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[1]}`,
      );
    } else {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[1]}`,
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
            router.push(`${baseRoute}`);
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
          step="did-stay"
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
        {didStay === false && (
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
          referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED]
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
              referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED]
                ? "profile:leave_reference.did_stay_confirmation.message_hosted"
                : "profile:leave_reference.did_stay_confirmation.message_surfed"
            }
            values={{ name: user.name }}
            components={{
              strong: <strong />,
              2: <StyledLink href={helpCenterReportContentURL} target="#" />,
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
            referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED]
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
