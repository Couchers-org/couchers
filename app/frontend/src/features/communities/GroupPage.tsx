import PageTitle from "../../components/PageTitle";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumbs } from "@material-ui/core";
import { Link } from "react-router-dom";
import { Group } from "../../pb/groups_pb"
import { service } from "../../service";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import TextBody from "../../components/TextBody";
import { useHistory } from "react-router-dom";
import { groupRoute, communityRoute } from "../../AppRoutes"
import Markdown from "../../components/Markdown";

export default function GroupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<Group.AsObject | null>(null);

  const history = useHistory();

  const { groupId, groupSlug } = useParams<{ groupId: string, groupSlug?: string }>();

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      setLoading(true);
      try {
        const group = await service.groups.getGroup(Number(groupId))
        setGroup(group);
        if (group.slug !== groupSlug) {
          // if the address is wrong, redirect to the right place
          history.push(`${groupRoute}/${group.groupId}/${group.slug}`);
        }
      } catch (e) {
        console.error(e)
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [groupId]);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : group ?
      <>
        <PageTitle>{group.name} Group Page</PageTitle>
        <Breadcrumbs aria-label="breadcrumb">
          {
            group.parentsList.map(parent => {
              if (parent.community) {
                return (
                  <Link to={`${communityRoute}/${parent.community.communityId}/${parent.community.slug}`}>
                    {parent.community.name}
                  </Link>
                )
              } else if (parent.group) {
                return (
                  <Link to={`${groupRoute}/${parent.group.groupId}/${parent.group.slug}`}>
                    {parent.group.name}
                  </Link>
                )
              }
            })
          }
        </Breadcrumbs>
        <p>Description: {group.description}</p>
        <p>Last edited at {group.mainPage!.lastEdited?.seconds} by {group.mainPage!.lastEditorUserId}</p>
        <p>Created at {group.created?.seconds} by {group.mainPage!.creatorUserId}</p>
        <Markdown source={group.mainPage!.content} />
        <p>You <b>{group.mainPage!.canEdit ? "can" : "cannot"}</b> edit this page.</p>
      </> :
        <TextBody>Error?</TextBody>
      }
    </>
  );
}
