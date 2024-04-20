import { appGetLayout } from "components/AppRoute";
import EventPageComponent from "features/communities/events/EventPage";
import NotFoundPage from "features/NotFoundPage";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import stringOrFirstString from "utils/stringOrFirstString";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, COMMUNITIES],
      nextI18nextConfig
    )),
  },
});

export default function EventPage() {
  const router = useRouter();

  const parsedId = Number.parseInt(stringOrFirstString(router.query.id) ?? "");
  if (isNaN(parsedId)) return <NotFoundPage />;
  const slug = stringOrFirstString(router.query.slug) ?? "";
  return <EventPageComponent eventId={parsedId} eventSlug={slug} />;
}

EventPage.getLayout = appGetLayout();
