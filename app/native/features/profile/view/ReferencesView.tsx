import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { ListReferencesRes } from "proto/references_pb";
import { UseInfiniteQueryResult } from "react-query";

import { ThemedText } from "@/components/ThemedText";
import hasAtLeastOnePage from "@/utils/hasAtLeastOnePage";
import { ActivityIndicator, View } from "react-native";

import useUsers from "@/features/userQueries/useUser";
import ReferenceList from "./ReferenceList";

interface ReferencesViewProps {
  isReceived?: boolean;
  isReferenceUsersLoading: boolean;
  referencesQuery: UseInfiniteQueryResult<ListReferencesRes.AsObject, RpcError>;
  referenceUsers: ReturnType<typeof useUsers>["data"];
}

export default function ReferencesView({
  isReceived,
  isReferenceUsersLoading,
  referencesQuery: {
    data: referencesRes,
    error: referencesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isReferencesLoading,
  },
  referenceUsers,
}: ReferencesViewProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  return (
    <>
      {referencesError && <Alert>{referencesError.message}</Alert>}
      {isReferenceUsersLoading || isReferencesLoading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : hasAtLeastOnePage(referencesRes, "referencesList") ? (
        <>
          <ReferenceList
            isReceived={isReceived}
            referencePages={referencesRes.pages}
            referenceUsers={referenceUsers}
          />
          {hasNextPage && (
            <View>
              <Button
                loading={isFetchingNextPage}
                onPress={() => fetchNextPage()}
                title={t("profile:see_more_references")}
              />
            </View>
          )}
        </>
      ) : (
        <TextBody>{t("profile:no_references")}</TextBody>
      )}
    </>
  );
}
