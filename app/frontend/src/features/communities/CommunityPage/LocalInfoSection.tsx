import { Typography } from "@material-ui/core";
import { LocationIcon } from "components/Icons";
import { LOCAL_INFO_TITLE } from "features/communities/constants";
import { Community } from "pb/communities_pb";
import React, { useMemo } from "react";
import stripMarkdown from "utils/stripMarkdown";

import { useCommunityPageStyles } from "./CommunityPage";
import SectionTitle from "./SectionTitle";

export default function LocalInfoSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useCommunityPageStyles();

  const strippedInfo = useMemo(() => {
    if (!community.mainPage?.content) return "";
    const stripped = stripMarkdown(community.mainPage.content);
    if (stripped.length <= 200) return stripped;
    else return `${stripped.substr(0, 197)}...}`;
  }, [community.mainPage?.content]);

  return (
    <>
      <SectionTitle icon={<LocationIcon />}>{LOCAL_INFO_TITLE}</SectionTitle>
      <Typography variant="body1" paragraph>
        {strippedInfo}
      </Typography>
    </>
  );
}
