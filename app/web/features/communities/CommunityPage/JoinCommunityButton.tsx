import Button from "components/Button";
import Snackbar from "components/Snackbar";
import { communityKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function JoinCommunityButton({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const queryClient = useQueryClient();
  const join = useMutation<void, RpcError>(
    () => service.communities.joinCommunity(community.communityId),
    {
      onSuccess() {
        queryClient.setQueryData<Community.AsObject | undefined>(
          communityKey(community.communityId),
          (prevData) =>
            prevData
              ? {
                  ...prevData,
                  member: true,
                }
              : undefined
        );
        queryClient.invalidateQueries(communityKey(community.communityId));
      },
    }
  );
  const leave = useMutation<void, RpcError>(
    () => service.communities.leaveCommunity(community.communityId),
    {
      onSuccess() {
        queryClient.setQueryData<Community.AsObject | undefined>(
          communityKey(community.communityId),
          (prevData) =>
            prevData
              ? {
                  ...prevData,
                  member: false,
                }
              : undefined
        );
        queryClient.invalidateQueries(communityKey(community.communityId));
      },
    }
  );
  const isLoading = join.isLoading || leave.isLoading;
  return (
    <>
      <Button
        loading={isLoading}
        variant={community.member ? "outlined" : "contained"}
        onClick={() => (community.member ? leave.mutate() : join.mutate())}
      >
        {community.member
          ? t("communities:leave_community")
          : t("communities:join_community")}
      </Button>
      {(join.isError || leave.isError) && (
        <Snackbar severity="error">
          {join.error?.message || leave.error?.message}
        </Snackbar>
      )}
    </>
  );
}
