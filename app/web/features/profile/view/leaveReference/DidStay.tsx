import { styled } from "@mui/material";
import Button from "components/Button";
import TextBody from "components/TextBody";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { useForm } from "react-hook-form";
import {
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";
import { indicateDidntMeetup } from "service/references";

import ReferenceStepHeader from "./formSteps/ReferenceStepHeader";
import { ReferenceContextFormData, ReferenceStepProps } from "./ReferenceForm";
import TextField from "components/TextField";

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
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ReferenceContextFormData>({ defaultValues: referenceData });

  const onSubmit = handleSubmit(async (values) => {
    if (
      !referenceData.didStay &&
      hostRequestId &&
      referenceData.reasonDidntMeetup
    ) {
      await indicateDidntMeetup({
        hostRequestId,
        reasonDidntMeetup: referenceData.reasonDidntMeetup,
      });
    } else {
      if (
        referenceType ===
        referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
      ) {
        router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[1]}`,
        );
      } else {
        router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[1]}`,
        );
      }
    }
  });

  const handleDidStay = () => {
    setReferenceValues({ ...referenceData, didStay: true });

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

  const handleDidNotStay = () => {
    setReferenceValues({ ...referenceData, didStay: false });
  };

  return (
    <>
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
        <Button
          variant="outlined"
          type="submit"
          size="large"
          sx={{ marginTop: 2, marginRight: 2 }}
          onClick={handleDidNotStay}
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
      {referenceData.didStay === false && (
        <StyledReasonContainer>
          <TextField
            id="reasonDidntMeetup"
            name="reasonDidntMeetup"
            label={t("profile:leave_reference.reason_didnt_meetup")}
            error={!!errors.reasonDidntMeetup}
            helperText={errors.reasonDidntMeetup?.message}
            onChange={(event) => {
              setValue("reasonDidntMeetup", event.target.value);
            }}
            multiline
            minRows={5}
            sx={{ "& > .MuiInputBase-root": { width: "100%", marginTop: 1 } }}
          />
          <StyledButtonContainer>
            <Button type="submit" onClick={onSubmit}>
              {t("profile:leave_reference.next_step_label")}
            </Button>
          </StyledButtonContainer>
        </StyledReasonContainer>
      )}
    </>
  );
};

export default DidStay;
