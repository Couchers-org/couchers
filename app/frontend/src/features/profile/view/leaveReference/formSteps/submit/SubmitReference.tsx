import { useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { REFERENCE_SUCCESS, SUBMIT } from "features/profile/constants";
import {
  useWriteFriendReference,
  useWriteHostReference,
} from "features/profile/hooks/referencesHooks";
import ReferenceOverview from "features/profile/view/leaveReference/formSteps/submit/ReferenceOverview";
import {
  ReferenceContextFormData,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { User } from "pb/api_pb";
import { ReferenceType } from "pb/references_pb";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { referenceTypeRoute } from "routes";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";

export interface SubmitReferenceProps {
  user: User.AsObject;
  referenceData: ReferenceContextFormData;
}

export default function SubmitReference({
  user,
  referenceData,
}: SubmitReferenceProps) {
  const {
    writeFriendReference,
    status: friendReferenceWritingStatus,
    reset: resetFriendReferenceWriting,
    error: friendReferenceError,
    isLoading: isFriendReferenceLoading,
  } = useWriteFriendReference(user.userId);
  const {
    writeHostRequestReference,
    status: hostRequestReferenceWritingStatus,
    reset: resetHostRequestReferenceWriting,
    error: hostRequestReferenceError,
    isLoading: isHostRequestReferenceLoading,
  } = useWriteHostReference(user.userId);

  const { referenceType, hostRequest } = useParams<{
    referenceType: string;
    hostRequest?: string;
  }>();
  const theme = useTheme();
  const classes = useReferenceStyles();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { handleSubmit } = useForm<ReferenceContextFormData>();

  const onFriendReferenceSubmit = () => {
    const formData: WriteFriendReferenceInput =
      referenceData.wasAppropriate === "true"
        ? {
            toUserId: user.userId,
            wasAppropriate: true,
            text: referenceData.text,
            rating: referenceData.rating,
          }
        : {
            toUserId: user.userId,
            wasAppropriate: false,
            text: referenceData.text,
            rating: referenceData.rating,
          };

    resetFriendReferenceWriting();
    writeFriendReference({
      referenceData: formData,
    });
    window.scroll({ top: 0 });
  };

  const onHostReferenceSubmit = () => {
    if (hostRequest && +hostRequest !== undefined) {
      const formData: WriteHostRequestReferenceInput =
        referenceData.wasAppropriate === "true"
          ? {
              hostRequestId: +hostRequest,
              wasAppropriate: true,
              text: referenceData.text,
              rating: referenceData.rating,
            }
          : {
              hostRequestId: +hostRequest,
              wasAppropriate: false,
              text: referenceData.text,
              rating: referenceData.rating,
            };

      resetHostRequestReferenceWriting();
      writeHostRequestReference({
        referenceData: formData,
      });
      window.scroll({ top: 0 });
    }
  };

  let onSubmit: () => void;
  referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ? (onSubmit = onFriendReferenceSubmit)
    : (onSubmit = onHostReferenceSubmit);

  return (
    <>
      {(friendReferenceWritingStatus || hostRequestReferenceWritingStatus) ===
      "success" ? (
        <Alert className={classes.alert} severity="success">
          {REFERENCE_SUCCESS}
        </Alert>
      ) : friendReferenceError ? (
        <Alert className={classes.alert} severity="error">
          {friendReferenceError.message}
        </Alert>
      ) : hostRequestReferenceError ? (
        <Alert className={classes.alert} severity="error">
          {hostRequestReferenceError.message}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <ReferenceOverview user={user} referenceData={referenceData} />
        <div className={classes.buttonContainer}>
          <Button
            fullWidth={!isSmOrWider}
            type="submit"
            loading={isFriendReferenceLoading || isHostRequestReferenceLoading}
          >
            {SUBMIT}
          </Button>
        </div>
      </form>
    </>
  );
}
