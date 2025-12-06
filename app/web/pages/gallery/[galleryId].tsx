import { Container } from "@mui/material";
import { appGetLayout } from "components/AppRoute";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import GalleryEditor from "features/gallery/GalleryEditor";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL],
      nextI18nextConfig,
    )),
  },
});

export default function GalleryPage() {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();
  const { galleryId } = router.query;

  const parsedGalleryId = parseInt(galleryId as string, 10);

  if (isNaN(parsedGalleryId)) {
    return (
      <>
        <HtmlMeta title={t("global:error.invalid_gallery_id")} />
        <Container maxWidth="md">
          <PageTitle>{t("global:error.invalid_gallery_id")}</PageTitle>
        </Container>
      </>
    );
  }

  return (
    <>
      <HtmlMeta title={t("global:gallery.page_title")} />
      <Container maxWidth="lg">
        <PageTitle>{t("global:gallery.page_title")}</PageTitle>
        <GalleryEditor galleryId={parsedGalleryId} />
      </Container>
    </>
  );
}

GalleryPage.getLayout = appGetLayout({
  isPrivate: true,
});
