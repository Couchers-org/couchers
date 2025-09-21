import { Discussions, Groups, Pages } from "@couchers/services";
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
import {
  routeToCommunity,
  routeToDiscussion,
  routeToGroup,
  routeToGuide,
  routeToPlace,
} from "@/routes";
import serviceClients from "@/serviceClients";
import { useErrorMessage } from "@/utils/error";

const GroupPage = ({
  groupId,
  groupSlug,
}: {
  groupId: bigint;
  groupSlug?: string;
}) => {
  const { t } = useTranslation(["communities", "global"]);
  const [isLoading, setIsLoading] = useState(false);
  const { errorMessage, setError } = useErrorMessage(t);

  const [group, setGroup] = useState<Groups.Group | undefined>();

  const [isAdminsLoading, setIsAdminsLoading] = useState(false);
  const [admins, setAdmins] = useState<bigint[] | undefined>();

  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [members, setMembers] = useState<bigint[] | undefined>();

  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [places, setPlaces] = useState<Pages.Page[] | undefined>();

  const [isGuidesLoading, setIsGuidesLoading] = useState(false);
  const [guides, setGuides] = useState<Pages.Page[] | undefined>();

  const [isDiscussionsLoading, setIsDiscussionsLoading] = useState(false);
  const [discussions, setDiscussions] = useState<
    Discussions.Discussion[] | undefined
  >();

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    log.error(errorMessage);
  }, [errorMessage]);

  const handleJoin = async () => {
    if (!group?.groupId) {
      return;
    }

    await serviceClients.groups.joinGroup({ groupId: group.groupId });
  };

  const handleLeave = async () => {
    if (!group?.groupId) {
      return;
    }

    await serviceClients.groups.leaveGroup({ groupId: group.groupId });
  };

  const router = useRouter();

  useEffect(() => {
    if (!groupId) return;

    void (async () => {
      setIsLoading(true);
      try {
        const group = await serviceClients.groups.getGroup({
          groupId,
        });
        setGroup(group);

        if (group.slug !== groupSlug) {
          // if the address is wrong, redirect to the right place
          await router.push(routeToGroup(groupId, group.slug));
        }
      } catch (e) {
        setError(e);
      }
      setIsLoading(false);

      setIsAdminsLoading(true);
      try {
        const res = await serviceClients.groups.listAdmins({ groupId });
        setAdmins(res.adminUserIds.length ? res.adminUserIds : undefined);
      } catch (e) {
        setError(e);
      }
      setIsAdminsLoading(false);

      setIsMembersLoading(true);
      try {
        const res = await serviceClients.groups.listMembers({ groupId });
        setMembers(res.memberUserIds.length ? res.memberUserIds : undefined);
      } catch (e) {
        setError(e);
      }
      setIsMembersLoading(false);

      setIsPlacesLoading(true);
      try {
        const res = await serviceClients.groups.listPlaces({ groupId });

        setPlaces(res.places.length ? res.places : undefined);
      } catch (e) {
        log.error(e);
      }
      setIsPlacesLoading(false);

      setIsGuidesLoading(true);
      try {
        const res = await serviceClients.groups.listGuides({ groupId });
        setGuides(res.guides.length ? res.guides : undefined);
      } catch (e) {
        setError(e);
      }
      setIsGuidesLoading(false);

      setIsDiscussionsLoading(true);
      try {
        const res = await serviceClients.groups.listDiscussions({ groupId });
        setDiscussions(res.discussions.length ? res.discussions : undefined);
      } catch (e) {
        setError(e);
      }
      setIsDiscussionsLoading(false);
    })();
  }, [groupId, groupSlug, router, setError, t]);

  return (
    <>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : group ? (
        <>
          <HtmlMeta title={`${group.name} Group Page`} />
          <PageTitle>{group.name} Group Page</PageTitle>
          <Breadcrumbs aria-label="breadcrumb">
            {group.parents
              .map((parent) => parent.parent)
              .map((parent) => {
                if (parent.case === "community") {
                  return (
                    <Link
                      key={parent.value.communityId}
                      href={routeToCommunity(
                        parent.value.communityId,
                        parent.value.slug,
                      )}
                    >
                      {parent.value.name}
                    </Link>
                  );
                } else if (parent.case === "group") {
                  return (
                    <Link
                      key={parent.value.groupId}
                      href={routeToGroup(
                        parent.value.groupId,
                        parent.value.slug,
                      )}
                    >
                      {parent.value.name}
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

          {group.mainPage?.thread?.threadId && (
            <CommentBox threadId={group.mainPage.thread.threadId} />
          )}
        </>
      ) : (
        <TextBody>Error</TextBody>
      )}
    </>
  );
};

export default GroupPage;
