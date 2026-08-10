import { appGetLayout } from "components/AppRoute";
import PageContainer from "components/PageContainer";
import AllMessagesTab from "features/messages/AllMessagesTab";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import MessagesHeader from "features/messages/MessagesHeader";
import HostRequestView from "features/messages/requests/HostRequestView";
import NotFoundPage from "features/NotFoundPage";
import { GLOBAL, MESSAGES, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { translationStaticProps } from "i18n/server-side-translations";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { messageTypeStrings } from "routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = translationStaticProps([GLOBAL, MESSAGES, NOTIFICATIONS, PROFILE]);
function MessagesPageContent() {
  const router = useRouter();
  const slugs =
    typeof router.query.slug === "undefined"
      ? ["all"]
      : typeof router.query.slug === "string"
        ? [router.query.slug]
        : router.query.slug;

  const tab = messageTypeStrings.find((valid) => valid === slugs[0]);

  // Route: /messages, /messages/all, /messages/unread, /messages/chats, /messages/hosting, /messages/surfing, /messages/archived (list views)
  if (tab && !slugs[1]) {
    return (
      <>
        <MessagesHeader tab={tab} />
        <AllMessagesTab />
      </>
    );
  }

  // Route: /messages/chats/123 (individual chat view)
  if (slugs[0] === "chats" && slugs[1]) {
    const chatId = Number.parseInt(slugs[1]);
    if (isNaN(chatId)) {
      return <NotFoundPage />;
    }
    return <GroupChatView chatId={chatId} />;
  }

  // Route: /messages/request/123 (host request view)
  if (slugs[0] === "request" && slugs[1]) {
    const requestId = Number.parseInt(slugs[1]);
    if (isNaN(requestId)) {
      return <NotFoundPage />;
    }
    return <HostRequestView hostRequestId={requestId} />;
  }

  // Invalid route - show 404
  return <NotFoundPage />;
}

export default function MessagesPage() {
  return (
    <PageContainer disableGutters>
      <MessagesPageContent />
    </PageContainer>
  );
}

MessagesPage.getLayout = appGetLayout({
  variant: "full-width",
  noFooter: true,
});
