import PageTitle from "../../components/PageTitle";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Page, PageType } from "../../pb/pages_pb";
import { service } from "../../service";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import TextBody from "../../components/TextBody";
import { useHistory } from "react-router-dom";
import Markdown from "../../components/Markdown";
import { pageURL } from "./redirect";

export default function PagePage({ pageType }: { pageType: PageType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<Page.AsObject | null>(null);

  const history = useHistory();

  const { pageId, pageSlug } = useParams<{
    pageId: string;
    pageSlug?: string;
  }>();

  useEffect(() => {
    if (!pageId) return;
    (async () => {
      setLoading(true);
      try {
        const page = await service.pages.getPage(Number(pageId));
        if (page.slug !== pageSlug || page.type !== pageType) {
          // if the address is wrong, redirect to the right place
          history.push(pageURL(page));
        } else {
          setPage(page);
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [pageType, pageId, pageSlug, history]);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : page ? (
        <>
          <PageTitle>{page.title}</PageTitle>
          <p>
            Owner:{" "}
            {page.ownerUserId !== 0
              ? "user " + page.ownerUserId
              : "cluster " + page.ownerClusterId}
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
        </>
      ) : (
        <TextBody>Error</TextBody>
      )}
    </>
  );
}
