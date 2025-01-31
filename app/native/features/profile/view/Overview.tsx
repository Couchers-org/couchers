import Alert from "@/components/Alert";
import Button from "@/components/Button";
// import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
// import { useAuthContext } from "features/auth/AuthProvider";
// import useAccountInfo from "features/auth/useAccountInfo";
// import FlagButton from "features/FlagButton";
// import FriendActions from "features/profile/actions/FriendActions";
// import MessageUserButton from "features/profile/actions/MessageUserButton";
// import UserOverview from "features/profile/view/UserOverview";
import { GLOBAL, PROFILE } from "i18n/namespaces";
// import Link from "next/link";
import { useTranslation } from "i18n";
import { HostingStatus } from "proto/api_pb";
import { useState } from "react";
import {
  // connectionsRoute,
  EditUserTab,
  // routeToEditProfile,
  UserTab,
} from "@/routes";
import { useAuthContext } from "@/features/auth/AuthProvider";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { useProfileUser } from "../hooks/useProfileUser";
import { ThemedText } from "@/components/ThemedText";
import UserOverview from "./UserOverview";
import useAccountInfo from "@/features/auth/useAccountInfo";
import MessageUserButton from "../actions/MessageUserButton";
import FriendActions from "../actions/FriendActions";
import FlagButton from "@/features/FlagButton";
// import makeStyles from "utils/makeStyles";

// import { useProfileUser } from "../hooks/useProfileUser";

// const useStyles = makeStyles((theme) => ({
//   flagButton: {
//     alignSelf: "center",
//   },
// }));

const getEditTab = (tab: UserTab): EditUserTab | undefined => {
  switch (tab) {
    case "about":
    case "home":
      return tab;
    default:
      return undefined;
  }
};

// function LoggedInUserActions({ tab }: { tab: UserTab }) {
//   const { t } = useTranslation([GLOBAL, PROFILE]);
//   return (
//     <>
//       <Link href={routeToEditProfile(getEditTab(tab))} passHref>
//         <Button component="a" color="primary">
//           {t("global:edit")}
//         </Button>
//       </Link>
//       <Link href={connectionsRoute} passHref>
//         <Button component="a" variant="outlined">
//           {t("profile:my_connections")}
//         </Button>
//       </Link>
//     </>
//   );
// }

function DefaultActions({
  setIsRequesting,
}: {
  setIsRequesting: (value: boolean) => void;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const disableHosting =
    user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST;

  const [mutationError, setMutationError] = useState("");
  const [showCantRequestDialog, setShowCantRequestDialog] =
    useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  const requestButton = () => {
    if (!accountInfo?.profileComplete) {
      setShowCantRequestDialog(true);
    } else {
      setIsRequesting(true);
    }
  };

  return (
    <>
      {/* <ProfileIncompleteDialog
        open={showCantRequestDialog}
        onClose={() => setShowCantRequestDialog(false)}
        attempted_action="send_request"
      />
      <Button
        onClick={requestButton}
        disabled={isAccountInfoLoading || disableHosting}
      >
        {disableHosting
          ? t("global:hosting_status.cant_host")
          : t("profile:actions.request")}
      </Button> */}

      <MessageUserButton user={user} setMutationError={setMutationError} />
      <FriendActions user={user} setMutationError={setMutationError} />

      <FlagButton
        contentRef={`profile/${user.userId}`}
        authorUser={user.userId}
      />

      {mutationError && <Alert>{mutationError}</Alert>}
    </>
  );
}

export interface OverviewProps {
  setIsRequesting: (value: boolean) => void;
  tab: UserTab;
}

export default function Overview({ setIsRequesting, tab }: OverviewProps) {
  const currentUserId = useAuthContext().authState.userId;
  const user = useProfileUser();

  return (
    <UserOverview
      showHostAndMeetAvailability
      actions={
        user.userId === currentUserId ? (
          // <LoggedInUserActions tab={tab} />
          <ThemedText>No actions here yet</ThemedText>
        ) : (
          <DefaultActions setIsRequesting={setIsRequesting} />
        )
      }
    />
  );
}
