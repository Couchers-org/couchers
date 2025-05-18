import { Alert, Box, styled } from "@mui/material";
import Button from "components/Button";
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
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";
import { indicateDidntMeetup } from "service/references";
import { theme } from "theme";

import { ReferenceStepProps } from "../ReferenceForm";
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
  marginTop: theme.spacing(1),
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
  const isMobile = theme.breakpoints.down("md");

  const [didSubmitNotStay, setDidSubmitNotStay] = useState(false);

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

  const handleDidStay = () => {
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
    <StyledForm onSubmit={onSubmitDidNotStay}>
      <ReferenceStepHeader
        name={user.name}
        referenceType={referenceType}
        isDidStayStep
      />
      <StyledTextBody>
        <Trans
          i18nKey="profile:leave_reference.did_stay_explanation"
          components={{ bold: <strong /> }}
        />
      </StyledTextBody>
      <StyledButtonContainer>
        <Controller
          control={control}
          name="didStay"
          render={({ field }) => (
            <>
              <Button
                variant="outlined"
                type="submit"
                size="large"
                sx={{ marginTop: 2, marginRight: 2 }}
                onClick={() => field.onChange(false)}
              >
                {t("global:no")}
              </Button>
              <Button
                variant="contained"
                type="submit"
                size="large"
                sx={{ marginTop: 2 }}
                onClick={() => {
                  field.onChange(true);
                  handleDidStay();
                }}
              >
                {t("global:yes")}
              </Button>
            </>
          )}
        ></Controller>
      </StyledButtonContainer>
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
                  "& > .MuiInputBase-root": { width: "100%", marginTop: 1 },
                }}
              />
            )}
          />
          <StyledButtonContainer>
            <Button fullWidth={isMobile} type="submit">
              {t("global:submit")}
            </Button>
          </StyledButtonContainer>
        </StyledReasonContainer>
      )}
    </StyledForm>
  );
};

export default DidStay;
