import { Breadcrumbs } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import CommentBox from "components/Comments/CommentBox";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import TextBody from "components/TextBody";
import { Discussion } from "pb/discussions_pb";
import { Group } from "pb/groups_pb";
import { Page } from "pb/pages_pb";
import React, { useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  routeToCommunity,
  routeToDiscussion,
  routeToGroup,
  routeToGuide,
  routeToPlace,
} from "routes";
import { service } from "service/index";

export default function GroupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<Group.AsObject | null>(null);

  const [adminsLoading, setAdminsLoading] = useState(false);
  const [admins, setAdmins] = useState<number[] | null>(null);

  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<number[] | null>(null);

  const [placesLoading, setPlacesLoading] = useState(false);
  const [places, setPlaces] = useState<Array<Page.AsObject> | null>(null);

  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guides, setGuides] = useState<Array<Page.AsObject> | null>(null);

  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [
    discussions,
    setDiscussions,
  ] = useState<Array<Discussion.AsObject> | null>(null);

  const history = useHistory();

  const { groupId, groupSlug } = useParams<{
    groupId: string;
    groupSlug?: string;
  }>();

  const handleJoin = async () => {
    await service.groups.joinGroup(group!.groupId);
  };

  const handleLeave = async () => {
    await service.groups.leaveGroup(group!.groupId);
  };

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      setLoading(true);
      try {
        const group = await service.groups.getGroup(Number(groupId));
        setGroup(group);
        if (group.slug !== groupSlug) {
          // if the address is wrong, redirect to the right place
          history.push(routeToGroup(group.groupId, group.slug));
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setLoading(false);

      setAdminsLoading(true);
      try {
        const res = await service.groups.listAdmins(Number(groupId));
        setAdmins(res.adminUserIdsList.length ? res.adminUserIdsList : null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setAdminsLoading(false);

      setMembersLoading(true);
      try {
        const res = await service.groups.listMembers(Number(groupId));
        setMembers(res.memberUserIdsList.length ? res.memberUserIdsList : null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setMembersLoading(false);

      setPlacesLoading(true);
      try {
        const res = await service.groups.listPlaces(Number(groupId));
        setPlaces(res.placesList.length ? res.placesList : null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setPlacesLoading(false);

      setGuidesLoading(true);
      try {
        const res = await service.groups.listGuides(Number(groupId));
        setGuides(res.guidesList.length ? res.guidesList : null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setGuidesLoading(false);

      setDiscussionsLoading(true);
      try {
        const res = await service.groups.listDiscussions(Number(groupId));
        setDiscussions(res.discussionsList.length ? res.discussionsList : null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setDiscussionsLoading(false);
    })();
  }, [groupId, groupSlug, history]);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : group ? (
        <>
          <PageTitle>{group.name} Group Page</PageTitle>
          <Breadcrumbs aria-label="breadcrumb">
            {group.parentsList
              .filter((parent) => !!parent.community || !!parent.group)
              .map((parent) => {
                if (parent.community) {
                  return (
                    <Link
                      to={routeToCommunity(
                        parent.community.communityId,
                        parent.community.slug
                      )}
                    >
                      {parent.community.name}
                    </Link>
                  );
                } else if (parent.group) {
                  return (
                    <Link
                      to={routeToGroup(parent.group.groupId, parent.group.slug)}
                    >
                      {parent.group.name}
                    </Link>
                  );
                } else {
                  return <></>;
                }
              })}
          </Breadcrumbs>
          <p>Description: {group.description}</p>
          <p>
            {group.member ? (
              <>
                You <b>are</b> a member of this group.
                <br />
                <Button onClick={handleLeave}>Leave group</Button>
              </>
            ) : (
              <>
                You <b>are not</b> a member of this group.
                <br />
                <Button onClick={handleJoin}>Join group</Button>
              </>
            )}
          </p>
          <p>
            You <b>{group.admin ? "are" : "are not"}</b> an admin of this group.
          </p>
          <p>
            Last edited at {group.mainPage!.lastEdited?.seconds} by{" "}
            {group.mainPage!.lastEditorUserId}
          </p>
          <p>
            Created at {group.created?.seconds} by{" "}
            {group.mainPage!.creatorUserId}
          </p>
          <Markdown source={group.mainPage!.content} />
          <p>
            You <b>{group.mainPage!.canEdit ? "can" : "cannot"}</b> edit this
            page.
          </p>
          <h1>Admins</h1>
          <p>Total {group.adminCount} admins.</p>
          {adminsLoading ? (
            <CircularProgress />
          ) : admins ? (
            admins.map((admin) => {
              return (
                <>
                  ID: {admin}
                  <br />
                </>
              );
            })
          ) : (
            <p>This group has no admins.</p>
          )}
          <h1>Members</h1>
          <p>Total {group.memberCount} members.</p>
          {membersLoading ? (
            <CircularProgress />
          ) : members ? (
            members.map((member) => {
              return (
                <>
                  ID: {member}
                  <br />
                </>
              );
            })
          ) : (
            <p>This group has no members.</p>
          )}
          <h1>Places</h1>
          {placesLoading ? (
            <CircularProgress />
          ) : places ? (
            places.map((place) => {
              return (
                <>
                  <Link to={routeToPlace(place.pageId, place.slug)}>
                    {place.title}
                  </Link>
                  <br />
                </>
              );
            })
          ) : (
            <p>This group contains no places.</p>
          )}
          <h1>Guides</h1>
          {guidesLoading ? (
            <CircularProgress />
          ) : guides ? (
            guides.map((guide) => {
              return (
                <>
                  <Link to={routeToGuide(guide.pageId, guide.slug)}>
                    {guide.title}
                  </Link>
                  <br />
                </>
              );
            })
          ) : (
            <p>This group contains no guides.</p>
          )}
          <h1>Discussions</h1>
          {discussionsLoading ? (
            <CircularProgress />
          ) : discussions ? (
            discussions.map((discussion) => {
              return (
                <>
                  <Link
                    to={routeToDiscussion(
                      discussion.discussionId,
                      discussion.slug
                    )}
                  >
                    {discussion.title}
                  </Link>
                  <br />
                </>
              );
            })
          ) : (
            <p>This group contains no discussions.</p>
          )}
          <CommentBox threadId={group.mainPage!.threadId} />
        </>
      ) : (
        <TextBody>Error</TextBody>
      )}
    </>
  );
}
