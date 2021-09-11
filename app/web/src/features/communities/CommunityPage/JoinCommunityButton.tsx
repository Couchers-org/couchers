import Button from "components/Button";
import Snackbar from "components/Snackbar";
import {
  JOIN_COMMUNITY,
  LEAVE_COMMUNITY,
} from "features/communities/constants";
import { Error as GrpcError } from "grpc-web";
import { Community } from "proto/communities_pb";
import { communityKey } from "queryKeys";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function JoinCommunityButton({
  community,
}: {
  community: Community.AsObject;
}) {
  const queryClient = useQueryClient();
  const join = useMutation<void, GrpcError>(
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
  const leave = useMutation<void, GrpcError>(
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
        {community.member ? LEAVE_COMMUNITY : JOIN_COMMUNITY}
      </Button>
      {(join.isError || leave.isError) && (
        <Snackbar severity="error">
          {join.error?.message || leave.error?.message}
        </Snackbar>
      )}
    </>
  );
}
