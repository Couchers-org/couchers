import { appGetLayout } from "components/AppRoute";
import GroupChatsTab from "features/messages/groupchats/GroupChatsTab";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import MessagesHeader from "features/messages/MessagesHeader";
import HostRequestView from "features/messages/requests/HostRequestView";
import RequestsTab from "features/messages/requests/RequestsTab";
import NotFoundPage from "features/NotFoundPage";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactNode } from "react";
import { messageTypeStrings } from "routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "messages"],
      nextI18nextConfig
    )),
  },
});
export default function LeaveReferencePage() {
  const router = useRouter();
  const slugs =
    typeof router.query.slug === "undefined"
      ? ["chats"]
      : typeof router.query.slug === "string"
      ? [router.query.slug]
      : router.query.slug;
  let content: ReactNode;

  const tab = messageTypeStrings.find((valid) => valid === slugs?.[0]);

  if (slugs[0] === "chats") {
    const id = Number.parseInt(slugs?.[1]);
    if (isNaN(id)) {
      content = <GroupChatsTab />;
    } else {
      content = <GroupChatView chatId={id} />;
    }
  } else if (slugs[0] === "request") {
    const id = Number.parseInt(slugs?.[1]);
    if (isNaN(id)) {
      return <NotFoundPage />;
    } else {
      content = <HostRequestView hostRequestId={id} />;
    }
  } else if (slugs[0] === "hosting") content = <RequestsTab type="hosting" />;
  else if (slugs[0] === "surfing") content = <RequestsTab type="surfing" />;

  return (
    <>
      {!slugs[1] && <MessagesHeader tab={tab} />}
      {content}
    </>
  );
}

LeaveReferencePage.getLayout = appGetLayout();
