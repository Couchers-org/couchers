import { Breadcrumbs } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import React, { useEffect } from "react";
import { Link, useHistory, useParams } from "react-router-dom";

import Alert from "../../components/Alert";
import Button from "../../components/Button";
import CircularProgress from "../../components/CircularProgress";
import CommentBox from "../../components/Comments/CommentBox";
import Markdown from "../../components/Markdown";
import PageTitle from "../../components/PageTitle";
import TextBody from "../../components/TextBody";
import {
  routeToCommunity,
  routeToDiscussion,
  routeToGroup,
  routeToGuide,
  routeToPlace,
} from "../../routes";
import { service } from "../../service";
import {
  useCommunity,
  useListAdmins,
  useListDiscussions,
  useListGroups,
  useListGuides,
  useListMembers,
  useListNearbyUsers,
  useListPlaces,
  useListSubCommunities,
} from "./useCommunity";

export default function CommunityPage() {
  const history = useHistory();

  const { communityId, communitySlug } = useParams<{
    communityId: string;
    communitySlug?: string;
  }>();

  const {
    isLoading: isCommunityLoading,
    error: communityError,
    data: community,
  } = useCommunity(+communityId);

  const {
    isLoading: isSubCommunitiesLoading,
    error: subCommunitiesError,
    data: subCommunities,
    //fetchNextPage: fetchNextSubCommunitiesPage,
  } = useListSubCommunities(+communityId);

  const {
    isLoading: isGroupsLoading,
    error: groupsError,
    data: groups,
    //fetchNextPage: fetchNextGroupsPage,
  } = useListGroups(+communityId);

  const {
    isLoading: isPlacesLoading,
    error: placesError,
    data: places,
    //fetchNextPage: fetchNextPlacesPage,
  } = useListPlaces(+communityId);

  const {
    isLoading: isGuidesLoading,
    error: guidesError,
    data: guides,
    //fetchNextPage: fetchNextGuidesPage,
  } = useListGuides(+communityId);

  const {
    isLoading: isDiscussionsLoading,
    error: discussionsError,
    data: discussions,
    //fetchNextPage: fetchNextDiscussionsPage,
  } = useListDiscussions(+communityId);

  const {
    isLoading: isAdminsLoading,
    error: adminsError,
    data: admins,
    //fetchNextPage: fetchNextAdminsPage,
  } = useListAdmins(+communityId);

  const {
    isLoading: isMembersLoading,
    error: membersError,
    data: members,
    //fetchNextPage: fetchNextMembersPage,
  } = useListMembers(+communityId);

  const {
    isLoading: isNearbyUsersLoading,
    error: nearbyUsersError,
    data: nearbyUsers,
    //fetchNextPage: fetchNextNearbyUsersPage,
  } = useListNearbyUsers(+communityId);

  const handleJoin = async () => {
    await service.communities.joinCommunity(community!.communityId);
  };

  const handleLeave = async () => {
    await service.communities.leaveCommunity(community!.communityId);
  };

  useEffect(() => {
    if (!community) return;
    if (community.slug !== communitySlug) {
      // if the address is wrong, redirect to the right place
      history.replace(routeToCommunity(community.communityId, community.slug));
    }
  }, [community, communitySlug, history]);

  if (!communityId)
    return <Alert severity="error">Invalid community id.</Alert>;

  return (
    <>
      <PageTitle>
        {community ? (
          `${community.name} Community Page`
        ) : (
          <Skeleton width={200} />
        )}
      </PageTitle>
      {isCommunityLoading && <CircularProgress />}
      {communityError && (
        <Alert severity="error">{communityError.message}</Alert>
      )}
      {community && (
        <>
          <Breadcrumbs aria-label="breadcrumb">
            {community.parentsList
              .filter((parent) => !!parent.community)
              .map((parent) => (
                <Link
                  to={routeToCommunity(
                    parent.community!.communityId,
                    parent.community!.slug
                  )}
                >
                  {parent.community!.name}
                </Link>
              ))}
          </Breadcrumbs>
          <p>Description: {community.description}</p>
          <p>
            {community.member ? (
              <>
                You <b>are</b> a member of this community.
                <br />
                <Button onClick={handleLeave}>Leave community</Button>
              </>
            ) : (
              <>
                You <b>are not</b> a member of this community.
                <br />
                <Button onClick={handleJoin}>Join community</Button>
              </>
            )}
          </p>
          <p>
            You <b>{community.admin ? "are" : "are not"}</b> an admin of this
            community.
          </p>
          <p>
            Last edited at {community.mainPage!.lastEdited?.seconds} by{" "}
            {community.mainPage!.lastEditorUserId}
          </p>
          <p>
            Created at {community.created?.seconds} by{" "}
            {community.mainPage!.creatorUserId}
          </p>
          <Markdown source={community.mainPage!.content} />
          <p>
            You <b>{community.mainPage!.canEdit ? "can" : "cannot"}</b> edit
            this page.
          </p>
          <h1>Sub-communities</h1>
          {isSubCommunitiesLoading && <CircularProgress />}
          {subCommunitiesError && (
            <Alert severity="error">{subCommunitiesError.message}</Alert>
          )}
          {subCommunities &&
            (subCommunities.pages.length === 0 ||
            subCommunities.pages[0].communitiesList.length === 0 ? (
              <TextBody>No subCommunities yet.</TextBody>
            ) : (
              subCommunities.pages
                .flatMap((page) => page.communitiesList)
                .map((subCommunity) => (
                  <>
                    <Link
                      to={routeToCommunity(
                        subCommunity.communityId,
                        subCommunity.slug
                      )}
                    >
                      {subCommunity.name}
                    </Link>
                    <br />
                  </>
                ))
            ))}
          <h1>Groups</h1>
          {isGroupsLoading && <CircularProgress />}
          {groupsError && <Alert severity="error">{groupsError.message}</Alert>}
          {groups &&
            (groups.pages.length === 0 ||
            groups.pages[0].groupsList.length === 0 ? (
              <TextBody>No groups yet.</TextBody>
            ) : (
              groups.pages
                .flatMap((page) => page.groupsList)
                .map((group) => (
                  <>
                    <Link to={routeToGroup(group.groupId, group.slug)}>
                      {group.name}
                    </Link>
                    <br />
                  </>
                ))
            ))}
          <h1>Admins</h1>
          {isAdminsLoading && <CircularProgress />}
          {adminsError && <Alert severity="error">{adminsError.message}</Alert>}
          {admins &&
            (admins.pages.length === 0 ||
            admins.pages[0].adminUserIdsList.length === 0 ? (
              <TextBody>No admins yet.</TextBody>
            ) : (
              admins.pages
                .flatMap((page) => page.adminUserIdsList)
                .map((admin) => (
                  <>
                    ID: {admin}
                    <br />
                  </>
                ))
            ))}
          <h1>Members</h1>
          {isMembersLoading && <CircularProgress />}
          {membersError && (
            <Alert severity="error">{membersError.message}</Alert>
          )}
          {members &&
            (members.pages.length === 0 ||
            members.pages[0].memberUserIdsList.length === 0 ? (
              <TextBody>No members yet.</TextBody>
            ) : (
              members.pages
                .flatMap((page) => page.memberUserIdsList)
                .map((member) => (
                  <>
                    ID: {member}
                    <br />
                  </>
                ))
            ))}
          <h1>Users in this community</h1>
          {isNearbyUsersLoading && <CircularProgress />}
          {nearbyUsersError && (
            <Alert severity="error">{nearbyUsersError.message}</Alert>
          )}
          {nearbyUsers &&
            (nearbyUsers.pages.length === 0 ||
            nearbyUsers.pages[0].nearbyUserIdsList.length === 0 ? (
              <TextBody>No nearbyUsers yet.</TextBody>
            ) : (
              nearbyUsers.pages
                .flatMap((page) => page.nearbyUserIdsList)
                .map((user) => (
                  <>
                    ID: {user}
                    <br />
                  </>
                ))
            ))}

          <h1>Places</h1>
          {isPlacesLoading && <CircularProgress />}
          {placesError && <Alert severity="error">{placesError.message}</Alert>}
          {places &&
            (places.pages.length === 0 ||
            places.pages[0].placesList.length === 0 ? (
              <TextBody>No places yet.</TextBody>
            ) : (
              places.pages
                .flatMap((page) => page.placesList)
                .map((place) => (
                  <>
                    <Link to={routeToPlace(place.pageId, place.slug)}>
                      {place.title}
                    </Link>
                    <br />
                  </>
                ))
            ))}
          <h1>Guides</h1>
          {isGuidesLoading && <CircularProgress />}
          {guidesError && <Alert severity="error">{guidesError.message}</Alert>}
          {guides &&
            (guides.pages.length === 0 ||
            guides.pages[0].guidesList.length === 0 ? (
              <TextBody>No guides yet.</TextBody>
            ) : (
              guides.pages
                .flatMap((page) => page.guidesList)
                .map((guide) => (
                  <>
                    <Link to={routeToGuide(guide.pageId, guide.slug)}>
                      {guide.title}
                    </Link>
                    <br />
                  </>
                ))
            ))}
          <h1>Discussions</h1>
          {isDiscussionsLoading && <CircularProgress />}
          {discussionsError && (
            <Alert severity="error">{discussionsError.message}</Alert>
          )}
          {discussions &&
            (discussions.pages.length === 0 ||
            discussions.pages[0].discussionsList.length === 0 ? (
              <TextBody>No discussions yet.</TextBody>
            ) : (
              discussions.pages
                .flatMap((page) => page.discussionsList)
                .map((discussion) => (
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
                ))
            ))}
          <CommentBox threadId={community.mainPage!.threadId} />
        </>
      )}
    </>
  );
}
