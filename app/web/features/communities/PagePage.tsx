import { Pages } from "@couchers/services";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import CommentBox from "@/components/Comments/CommentBox";
import HtmlMeta from "@/components/HtmlMeta";
import Markdown from "@/components/Markdown";
import PageTitle from "@/components/PageTitle";
import TextBody from "@/components/TextBody";
import log from "@/log";
import { routeToGuide, routeToPlace } from "@/routes";
import serviceClients from "@/serviceClients";
import { useErrorMessage } from "@/utils/error";

const PagePage = ({
  pageType,
  pageId,
  pageSlug,
}: {
  pageType: Pages.PageType;
  pageId: bigint;
  pageSlug?: string;
}) => {
  const { t } = useTranslation(["communities", "global"]);
  const { errorMessage, setError } = useErrorMessage(t);

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState<Pages.Page | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!pageId) return;
    void (async () => {
      setIsLoading(true);
      try {
        const page = await serviceClients.pages.getPage({ pageId });

        if (
          page.slug !== pageSlug ||
          (page.type !== pageType && typeof window !== "undefined")
        ) {
          // if the address is wrong, redirect to the right place
          await router.push(
            pageType === Pages.PageType.PLACE
              ? routeToPlace(page.pageId, page.slug)
              : routeToGuide(page.pageId, page.slug),
          );
        } else {
          setPage(page);
        }
      } catch (e) {
        log.error(e);
        setError(e);
      }
      setIsLoading(false);
    })();
  }, [pageType, pageId, pageSlug, router, t, setError]);

  return (
    <>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : page ? (
        <>
          <HtmlMeta title={page.title} />
          {page.photoUrl && <Image src={page.photoUrl} alt="" />}
          <PageTitle>{page.title}</PageTitle>
          <p>
            Owner:{" "}
            {page.owner.case === "ownerUserId" && page.owner.value !== 0n
              ? `user ${page.owner.value}`
              : page.owner.case === "ownerCommunityId" &&
                  page.owner.value !== 0n
                ? `community ${page.owner.value}`
                : `group ${page.owner.value || 0n}`}
          </p>
          <p>
            Last edited at {page.lastEdited?.seconds} by {page.lastEditorUserId}
          </p>
          <p>
            Created at {page.created?.seconds} by {page.creatorUserId}
          </p>
          <p>
            Address: {page.address} (coords: {page.location?.lat ?? ""},{" "}
            {page.location?.lng ?? ""})
          </p>
          <Markdown source={page.content} />
          <p>
            You <b>{page.canEdit ? "can" : "cannot"}</b> edit this page.
          </p>
          {page.thread?.threadId && (
            <CommentBox threadId={page.thread.threadId} />
          )}
        </>
      ) : (
        <TextBody>Error</TextBody>
      )}
    </>
  );
};

export default PagePage;
