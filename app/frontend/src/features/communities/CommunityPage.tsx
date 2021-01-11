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
import { communityRoute, groupRoute } from "../../AppRoutes"
import Markdown from "../../components/Markdown";
import { Group } from "../../pb/groups_pb";

export default function CommunityPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [community, setCommunity] = useState<Community.AsObject | null>(null);

  const [subCommunitiesLoading, setSubCommunitiesLoading] = useState(false);
  const [subCommunities, setSubCommunities] = useState<Array<Community.AsObject> | null>(null);

  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groups, setGroups] = useState<Array<Group.AsObject> | null>(null);

  const [adminsLoading, setAdminsLoading] = useState(false);
  const [admins, setAdmins] = useState<number[] | null>(null);

  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<number[] | null>(null);

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

      setSubCommunitiesLoading(true);
      try {
        const res = await service.communities.listCommunities(Number(communityId))
        setSubCommunities(res.communitiesList.length ? res.communitiesList : null)
      } catch (e) {
        console.error(e)
        setError(e.message);
      }
      setSubCommunitiesLoading(false);

      setGroupsLoading(true);
      try {
        const res = await service.communities.listGroups(Number(communityId))
        setGroups(res.groupsList.length ? res.groupsList : null)
      } catch (e) {
        console.error(e)
        setError(e.message);
      }
      setGroupsLoading(false);

      setAdminsLoading(true);
      try {
        const res = await service.communities.listAdmins(Number(communityId))
        setAdmins(res.adminUserIdsList.length ? res.adminUserIdsList : null)
      } catch (e) {
        console.error(e)
        setError(e.message);
      }
      setAdminsLoading(false);

      setMembersLoading(true);
      try {
        const res = await service.communities.listMembers(Number(communityId))
        setMembers(res.memberUserIdsList.length ? res.memberUserIdsList : null)
      } catch (e) {
        console.error(e)
        setError(e.message);
      }
      setMembersLoading(false);
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
        <h1>Sub-communities</h1>
        {subCommunitiesLoading ? <CircularProgress /> :
        subCommunities ?
          subCommunities.map(subCommunity => {
            return (
              <>
                <Link to={`${communityRoute}/${subCommunity.communityId}/${subCommunity.slug}`}>
                  {subCommunity.name}
                </Link>
                <br />
              </>
            )
          })
          : <p>This community has no sub-communities.</p>
        }
        <h1>Groups</h1>
        {groupsLoading ? <CircularProgress /> :
        groups ?
          groups.map(group => {
            return (
              <>
                <Link to={`${groupRoute}/${group.groupId}/${group.slug}`}>
                  {group.name}
                </Link>
                <br />
              </>
            )
          })
          : <p>This community has no groups.</p>
        }
        <h1>Admins</h1>
        <p>Total {community.adminCount} admins.</p>
        {adminsLoading ? <CircularProgress /> :
        admins ?
          admins.map(admin => {
            return (
              <>
                ID: {admin}
                <br />
              </>
            )
          })
          : <p>This community has no admins.</p>
        }
        <h1>Members</h1>
        <p>Total {community.memberCount} members.</p>
        {membersLoading ? <CircularProgress /> :
        members ?
          members.map(member => {
            return (
              <>
                ID: {member}
                <br />
              </>
            )
          })
          : <p>This community has no members.</p>
        }
      </> :
        <TextBody>Error?</TextBody>
      }
    </>
  );
}
