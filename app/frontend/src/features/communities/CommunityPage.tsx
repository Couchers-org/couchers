import PageTitle from "../../components/PageTitle";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumbs } from "@material-ui/core";
import { Link } from "react-router-dom";
import { Community } from "../../pb/communities_pb"
import { service } from "../../service";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import TextBody from "../../components/TextBody";
import { useHistory } from "react-router-dom";
import { communityRoute } from "../../AppRoutes"
import Markdown from "../../components/Markdown";

export default function PagePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [community, setCommunity] = useState<Community.AsObject | null>(null);

  const history = useHistory();

  const { communityId, communitySlug } = useParams<{ communityId: string, communitySlug?: string }>();

  useEffect(() => {
    if (!communityId) return;
    (async () => {
      setLoading(true);
      try {
        const community = await service.communities.getCommunity(Number(communityId))
        setCommunity(community);
        if (community.slug !== communitySlug) {
          // if the address is wrong, redirect to the right place
          history.push(`${communityRoute}/${community.communityId}/${community.slug}`);
        }
      } catch (e) {
        console.error(e)
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [communityId]);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : community ?
      <>
        <PageTitle>{community.name} Community Page</PageTitle>
        <Breadcrumbs aria-label="breadcrumb">
          {
            community.parentsList.map(parent => {
              if (parent.community) {
                return (
                  <Link to={`${communityRoute}/${parent.community.communityId}/${parent.community.slug}`}>
                    {parent.community.name}
                  </Link>
                )
              }
            })
          }
        </Breadcrumbs>
        <p>Description: {community.description}</p>
        <p>Last edited at {community.mainPage!.lastEdited?.seconds} by {community.mainPage!.lastEditorUserId}</p>
        <p>Created at {community.created?.seconds} by {community.mainPage!.creatorUserId}</p>
        <Markdown source={community.mainPage!.content} />
        <p>You <b>{community.mainPage!.canEdit ? "can" : "cannot"}</b> edit this page.</p>
      </> :
        <TextBody>Error?</TextBody>
      }
    </>
  );
}
