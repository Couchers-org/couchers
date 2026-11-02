import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postalVerificationStatusQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetPostalVerificationStatusRes, PostalVerificationStatus } from "proto/postal_verification_pb";
import { useState } from "react";
import { service } from "service";
import { PostalAddressData } from "service/postalVerification";

/**
 * Which of the four steps the user is on. The backend owns this: the postcard
 * moves from "in_the_post" to "code" when the send job actually posts it, so
 * there is nothing for the user to click to advance.
 */
export type PostalStep = "address" | "confirm" | "in_the_post" | "code";

export const POSTAL_STEPS: PostalStep[] = ["address", "confirm", "in_the_post", "code"];

function stepFromStatus(status: GetPostalVerificationStatusRes.AsObject | undefined): PostalStep {
  switch (status?.status) {
    case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION:
      return "confirm";
    case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_IN_PROGRESS:
      return "in_the_post";
    case PostalVerificationStatus.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION:
      return "code";
    default:
      // No attempt yet, or the last one succeeded/failed/was cancelled.
      return "address";
  }
}

export default function usePostalVerification() {
  const queryClient = useQueryClient();

  /**
   * What the user typed, kept so the confirm step can show it struck through
   * beside the corrected version. Lost on reload, which only costs us the
   * comparison, not the ability to confirm.
   */
  const [submittedAddress, setSubmittedAddress] = useState<PostalAddressData | null>(null);
  const [wasCorrected, setWasCorrected] = useState(false);
  const [remainingCodeAttempts, setRemainingCodeAttempts] = useState<number | null>(null);
  const [isCodeWrong, setIsCodeWrong] = useState(false);

  const statusQuery = useQuery<GetPostalVerificationStatusRes.AsObject, RpcError>({
    queryKey: [postalVerificationStatusQueryKey],
    queryFn: service.postalVerification.getPostalVerificationStatus,
  });

  const invalidateStatus = () => queryClient.invalidateQueries({ queryKey: [postalVerificationStatusQueryKey] });

  const initiate = useMutation<void, RpcError, PostalAddressData>({
    mutationFn: async (address) => {
      const res = await service.postalVerification.initiatePostalVerification(address);
      setSubmittedAddress(address);
      setWasCorrected(res.addressWasCorrected);
    },
    onSuccess: invalidateStatus,
  });

  const confirm = useMutation<void, RpcError, number>({
    mutationFn: async (attemptId) => {
      await service.postalVerification.confirmPostalAddress(attemptId);
    },
    onSuccess: invalidateStatus,
  });

  const verifyCode = useMutation<boolean, RpcError, string>({
    mutationFn: async (code) => {
      const res = await service.postalVerification.verifyPostalCode(code);
      setIsCodeWrong(!res.success);
      setRemainingCodeAttempts(res.success ? null : res.remainingAttempts);
      return res.success;
    },
    onSuccess: invalidateStatus,
  });

  const cancel = useMutation<void, RpcError, number>({
    mutationFn: (attemptId) => service.postalVerification.cancelPostalVerification(attemptId),
    onSuccess: () => {
      setSubmittedAddress(null);
      setWasCorrected(false);
      setRemainingCodeAttempts(null);
      setIsCodeWrong(false);
      return invalidateStatus();
    },
  });

  const status = statusQuery.data;

  return {
    statusQuery,
    status,
    step: stepFromStatus(status),
    isVerified: !!status?.hasPostalVerification,
    submittedAddress: wasCorrected ? submittedAddress : null,
    remainingCodeAttempts,
    isCodeWrong,
    clearCodeError: () => setIsCodeWrong(false),
    initiate,
    confirm,
    verifyCode,
    cancel,
  };
}
