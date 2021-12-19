import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import EditProfilePageComponent from "features/profile/edit/EditProfilePage";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { editUserTabs } from "routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["global", "profile"])),
  },
});

export default function EditProfilePage() {
  const router = useRouter();

  const tab = router.query.tab;
  const parsedTab = editUserTabs.find((valid) => tab === valid);
  if (!parsedTab) return <NotFoundPage />;

  return <EditProfilePageComponent tab={parsedTab} />;
}

EditProfilePage.getLayout = appGetLayout();
