import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import LeaveReferencePageComponent from "features/profile/view/leaveReference/LeaveReferencePage";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { referenceStepStrings, referenceTypeRouteStrings } from "routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "profile"],
      nextI18nextConfig
    )),
  },
});
export default function LeaveReferencePage() {
  const router = useRouter();

  // leave-reference/:type/:userId/:hostRequestId?
  // leave-reference/friend/:userId/:step?
  // leave-reference/surfed|hosted/:userId/:hostRequestId/:step?
  const slug = router.query.slug;
  if (!slug?.[0] || !slug?.[1]) return <NotFoundPage />;
  const referenceType = slug[0];
  const parsedReferenceType = referenceTypeRouteStrings.find(
    (valid) => referenceType === valid
  );
  if (!parsedReferenceType) return <NotFoundPage />;
  const parsedUserId = Number.parseInt(slug[1]);
  if (isNaN(parsedUserId)) return <NotFoundPage />;
  let step: string | undefined = undefined;
  let hostRequestId = undefined;
  if (parsedReferenceType === "friend") {
    step = slug?.[2];
  } else {
    hostRequestId = slug?.[2];
    if (!hostRequestId) return <NotFoundPage />;
    step = slug?.[3];
  }
  const parsedStep = referenceStepStrings.find((s) => s === step);
  const parsedHostRequestId = hostRequestId
    ? Number.parseInt(hostRequestId)
    : undefined;

  return (
    <LeaveReferencePageComponent
      referenceType={parsedReferenceType}
      userId={parsedUserId}
      hostRequestId={parsedHostRequestId}
      step={parsedStep}
    />
  );
}

LeaveReferencePage.getLayout = appGetLayout();
