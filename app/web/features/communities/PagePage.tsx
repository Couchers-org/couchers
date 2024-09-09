import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import CommentBox from "components/Comments/CommentBox";
import HtmlMeta from "components/HtmlMeta";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import TextBody from "components/TextBody";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { Page, PageType } from "proto/pages_pb";
import React, { useEffect, useState } from "react";
import { routeToGuide, routeToPlace } from "routes";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";

export default function PagePage({
  pageType,
  pageId,
  pageSlug,
}: {
  pageType: PageType;
  pageId: number;
  pageSlug?: string;
}) {
  const { t } = useTranslation(["communities", "global"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<Page.AsObject | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!pageId) return;
    (async () => {
      setLoading(true);
      try {
        const page = await service.pages.getPage(pageId);
        if (
          page.slug !== pageSlug ||
          (page.type !== pageType && typeof window !== "undefined")
        ) {
          // if the address is wrong, redirect to the right place
          router.push(
            pageType === PageType.PAGE_TYPE_PLACE
              ? routeToPlace(page.pageId, page.slug)
              : routeToGuide(page.pageId, page.slug)
          );
        } else {
          setPage(page);
        }
      } catch (e) {
        console.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setLoading(false);
    })();
  }, [pageType, pageId, pageSlug, router, t]);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : page ? (
        <>
          <HtmlMeta title={page.title} />
          {page.photoUrl && <img src={page.photoUrl} alt="" />}
          <PageTitle>{page.title}</PageTitle>
          <p>
            Owner:{" "}
            {page.ownerUserId !== 0
              ? "user " + page.ownerUserId
              : page.ownerCommunityId !== 0
              ? "community " + page.ownerCommunityId
              : "group " + page.ownerGroupId}
          </p>
          <p>
            Last edited at {page.lastEdited?.seconds} by {page.lastEditorUserId}
          </p>
          <p>
            Created at {page.created?.seconds} by {page.creatorUserId}
          </p>
          <p>
            Address: {page.address} (coords: {page.location!.lat},{" "}
            {page.location!.lng})
          </p>
          <Markdown source={page.content} />
          <p>
            You <b>{page.canEdit ? "can" : "cannot"}</b> edit this page.
          </p>
          <CommentBox threadId={page.thread!.threadId} />
        </>
      ) : (
        <TextBody>Error</TextBody>
      )}
    </>
  );
}
