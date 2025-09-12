import { Breadcrumbs } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import CommentBox from "@/components/Comments/CommentBox";
import HtmlMeta from "@/components/HtmlMeta";
import Markdown from "@/components/Markdown";
import PageTitle from "@/components/PageTitle";
import TextBody from "@/components/TextBody";
import log from "@/log";
import { Discussion } from "@/proto/discussions_pb";
import { Group } from "@/proto/groups_pb";
import { Page } from "@/proto/pages_pb";
import {
  routeToCommunity,
  routeToDiscussion,
  routeToGroup,
  routeToGuide,
  routeToPlace,
} from "@/routes";
import { service } from "@/service";
import isGrpcError from "@/service/utils/isGrpcError";

const GroupPage = ({
  groupId,
  groupSlug,
}: {
  groupId: number;
  groupSlug?: string;
}) => {
  const { t } = useTranslation(["communities", "global"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<Group.AsObject | null>(null);

  const [isAdminsLoading, setIsAdminsLoading] = useState(false);
  const [admins, setAdmins] = useState<number[] | null>(null);

  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [members, setMembers] = useState<number[] | null>(null);

  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [places, setPlaces] = useState<Array<Page.AsObject> | null>(null);

  const [isGuidesLoading, setIsGuidesLoading] = useState(false);
  const [guides, setGuides] = useState<Array<Page.AsObject> | null>(null);

  const [isDiscussionsLoading, setIsDiscussionsLoading] = useState(false);
  const [discussions, setDiscussions] =
    useState<Array<Discussion.AsObject> | null>(null);

  const handleJoin = async () => {
    if (!group?.groupId) {
      return;
    }

    await service.groups.joinGroup(group.groupId);
  };

  const handleLeave = async () => {
    if (!group?.groupId) {
      return;
    }

    await service.groups.leaveGroup(group.groupId);
  };

  const router = useRouter();

  useEffect(() => {
    if (!groupId) return;
    void (async () => {
      setIsLoading(true);
      try {
        const group = await service.groups.getGroup(groupId);
        setGroup(group);
        if (group.slug !== groupSlug) {
          // if the address is wrong, redirect to the right place
          await router.push(routeToGroup(group.groupId, group.slug));
        }
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setIsLoading(false);

      setIsAdminsLoading(true);
      try {
        const res = await service.groups.listAdmins(groupId);
        setAdmins(res.adminUserIdsList.length ? res.adminUserIdsList : null);
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setIsAdminsLoading(false);

      setIsMembersLoading(true);
      try {
        const res = await service.groups.listMembers(groupId);
        setMembers(res.memberUserIdsList.length ? res.memberUserIdsList : null);
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setIsMembersLoading(false);

      setIsPlacesLoading(true);
      try {
        const res = await service.groups.listPlaces(groupId);
        setPlaces(res.placesList.length ? res.placesList : null);
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setIsPlacesLoading(false);

      setIsGuidesLoading(true);
      try {
        const res = await service.groups.listGuides(groupId);
        setGuides(res.guidesList.length ? res.guidesList : null);
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setIsGuidesLoading(false);

      setIsDiscussionsLoading(true);
      try {
        const res = await service.groups.listDiscussions(groupId);
        setDiscussions(res.discussionsList.length ? res.discussionsList : null);
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("global:error.fatal_message"));
      }
      setIsDiscussionsLoading(false);
    })();
  }, [groupId, groupSlug, router, t]);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : group ? (
        <>
          <HtmlMeta title={`${group.name} Group Page`} />
          <PageTitle>{group.name} Group Page</PageTitle>
          <Breadcrumbs aria-label="breadcrumb">
            {group.parentsList
              .filter((parent) => !!parent.community || !!parent.group)
              .map((parent) => {
                if (parent.community) {
                  return (
                    <Link
                      key={parent.community.communityId}
                      href={routeToCommunity(
                        parent.community.communityId,
                        parent.community.slug,
                      )}
                    >
                      {parent.community.name}
                    </Link>
                  );
                } else if (parent.group) {
                  return (
                    <Link
                      key={parent.group.groupId}
                      href={routeToGroup(
                        parent.group.groupId,
                        parent.group.slug,
                      )}
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
            Last edited at {group.mainPage?.lastEdited?.seconds} by{" "}
            {group.mainPage?.lastEditorUserId}
          </p>
          <p>
            Created at {group.created?.seconds} by{" "}
            {group.mainPage?.creatorUserId}
          </p>
          {group.mainPage?.content && (
            <Markdown source={group.mainPage.content} />
          )}
          <p>
            You <b>{group.mainPage?.canEdit ? "can" : "cannot"}</b> edit this
            page.
          </p>
          <h1>Admins</h1>
          <p>Total {group.adminCount} admins.</p>
          {isAdminsLoading ? (
            <CenteredSpinner />
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
          {isMembersLoading ? (
            <CenteredSpinner />
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
          {isPlacesLoading ? (
            <CenteredSpinner />
          ) : places ? (
            places.map((place) => {
              return (
                <>
                  <Link href={routeToPlace(place.pageId, place.slug)}>
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
          {isGuidesLoading ? (
            <CenteredSpinner />
          ) : guides ? (
            guides.map((guide) => {
              return (
                <>
                  <Link href={routeToGuide(guide.pageId, guide.slug)}>
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
          {isDiscussionsLoading ? (
            <CenteredSpinner />
          ) : discussions ? (
            discussions.map((discussion) => {
              return (
                <>
                  <Link
                    href={routeToDiscussion(
                      discussion.discussionId,
                      discussion.slug,
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
          <CommentBox threadId={group.mainPage?.thread?.threadId ?? 0} />
        </>
      ) : (
        <TextBody>Error</TextBody>
      )}
    </>
  );
};

export default GroupPage;
