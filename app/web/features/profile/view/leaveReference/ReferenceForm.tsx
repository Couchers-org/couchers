import { Alert } from "@mui/material";
import Redirect from "components/Redirect";
import PrivateFeedback from "features/profile/view/leaveReference/formSteps/PrivateFeedback";
import SubmitReference from "features/profile/view/leaveReference/formSteps/submit/SubmitReference";
import Text from "features/profile/view/leaveReference/formSteps/Text";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useState } from "react";
import { leaveReferenceBaseRoute, ReferenceStep } from "routes";

import DidStay from "./formSteps/DidStay";
import ThankYouReference from "./formSteps/submit/ThankYouReference";

export type ReferenceContextFormData = {
  didStay?: boolean;
  text: string;
  wasAppropriate: string;
  rating?: number;
  privateText?: string;
};

export interface ReferenceStepProps {
  referenceData: ReferenceContextFormData;
  setReferenceValues: (values: ReferenceContextFormData) => void;
  referenceType: string;
  hostRequestId?: number;
}

interface ReferenceRouteParams {
  referenceType: string;
  userId: number;
  hostRequestId?: number;
  step: ReferenceStep;
}

export default function ReferenceForm({ referenceType, userId, hostRequestId, step }: ReferenceRouteParams) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const [referenceData, setReferenceData] = useState<ReferenceContextFormData>({
    didStay: undefined,
    text: "",
    wasAppropriate: "",
    rating: undefined,
  });

  const setReferenceValues = (values: ReferenceContextFormData) => {
    setReferenceData((prevData) => ({
      ...prevData,
      ...values,
    }));
  };

  const isDidStaySkipped = referenceData.didStay === undefined && step !== "did-stay" && referenceType !== "friend";

  const isPrivateFeedbackSkipped =
    referenceData.wasAppropriate === "" && step !== "private-feedback" && step !== "did-stay";

  const redirectTo =
    referenceType === "friend"
      ? `${leaveReferenceBaseRoute}/${referenceType}/${userId}`
      : `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}`;

  if (isDidStaySkipped || isPrivateFeedbackSkipped) {
    return <Redirect to={redirectTo} />;
  }

  switch (step) {
    case "did-stay":
      return (
        <DidStay
          referenceData={referenceData}
          setReferenceValues={setReferenceValues}
          referenceType={referenceType}
          hostRequestId={hostRequestId}
        />
      );
    case "private-feedback":
      return (
        <PrivateFeedback
          referenceData={referenceData}
          setReferenceValues={setReferenceValues}
          referenceType={referenceType}
          hostRequestId={hostRequestId}
        />
      );
    case "reference":
      return (
        <Text
          referenceData={referenceData}
          setReferenceValues={setReferenceValues}
          referenceType={referenceType}
          hostRequestId={hostRequestId}
        />
      );
    case "submit":
      return (
        <SubmitReference
          referenceData={referenceData}
          referenceType={referenceType}
          hostRequestId={hostRequestId}
          userId={userId}
        />
      );
    case "thank-you":
      return <ThankYouReference />;
    default:
      return <Alert severity="error">{t("profile:leave_reference.invalid_step")}</Alert>;
  }
}
