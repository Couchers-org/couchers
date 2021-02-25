import { Card } from "@material-ui/core";
import React from "react";

import Avatar from "../../../components/Avatar";
import Divider from "../../../components/Divider";
import { CouchIcon, LocationIcon } from "../../../components/Icons";
import IconText from "../../../components/IconText";
import ScoreBar from "../../../components/ScoreBar";
import { HostingStatus, MeetupStatus } from "../../../pb/api_pb";
import { COMMUNITY_STANDING, VERIFICATION_PROGRESS } from "../../constants";
import useCurrentUser from "../../userQueries/useCurrentUser";
import { hostingStatusLabels, meetupStatusLabels } from "../constants";

export default function Overview() {
  const { data: user } = useCurrentUser();
  
  return (
    <Card>
      <Avatar user={user} />
      <div>
          {user?.name}
          {user?.city}
      </div>
      <Divider />
      <IconText icon={<CouchIcon />} text={hostingStatusLabels[user?.hostingStatus || HostingStatus.HOSTING_STATUS_UNKNOWN]} />
      <IconText icon={<LocationIcon />} text={meetupStatusLabels[user?.meetupStatus || MeetupStatus.MEETUP_STATUS_UNKNOWN]} />
      <Divider />
      <ScoreBar value={user?.communityStanding || 0} children={COMMUNITY_STANDING}></ScoreBar>
      <ScoreBar value={user?.verification || 0} children={VERIFICATION_PROGRESS}></ScoreBar>
    </Card>
  );
}
