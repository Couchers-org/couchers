import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";

import { appGetLayout } from "@/components/AppRoute";
import NotFoundPage from "@/features/NotFoundPage";
import LeaveReferencePageComponent from "@/features/profile/view/leaveReference/LeaveReferencePage";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "@/i18n/namespaces";
import { translationStaticProps } from "@/i18n/server-side-translations";
import { REFERENCE_STEP_STRINGS, REFERENCE_TYPE_ROUTE_STRINGS } from "@/routes";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = translationStaticProps([
  GLOBAL,
  PROFILE,
  NOTIFICATIONS,
]);

const LeaveReferencePage = () => {
  const router = useRouter();

  // leave-reference/:type/:userId/:hostRequestId?
  // leave-reference/friend/:userId/:step?
  // leave-reference/surfed|hosted/:userId/:hostRequestId/:step?
  const slug = router.query.slug;

  if (!slug?.[0] || !slug[1]) return <NotFoundPage />;
  const referenceType = slug[0];

  const parsedReferenceType = REFERENCE_TYPE_ROUTE_STRINGS.find(
    (valid) => referenceType === valid,
  );

  if (!parsedReferenceType) return <NotFoundPage />;
  const parsedUserId = Number.parseInt(slug[1]);
  if (isNaN(parsedUserId)) return <NotFoundPage />;
  let step: string | undefined = undefined;
  let hostRequestId = undefined;
  if (parsedReferenceType === "friend") {
    step = slug[2] ? slug[2] : REFERENCE_STEP_STRINGS[1];
  } else {
    hostRequestId = slug[2];
    if (!hostRequestId) return <NotFoundPage />;
    step = slug[3] ? slug[3] : REFERENCE_STEP_STRINGS[0];
  }
  const parsedStep = REFERENCE_STEP_STRINGS.find((s) => s === step);

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
};

LeaveReferencePage.getLayout = appGetLayout();

export default LeaveReferencePage;
