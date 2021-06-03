import { Typography } from "@material-ui/core";
import Button from "components/Button";
import { InfoIcon } from "components/Icons";
import { Community } from "pb/communities_pb";
import { Link } from "react-router-dom";
import { routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";

import { GENERAL_INFORMATION, SEE_MORE_INFORMATION } from "../constants";
import getContentSummary from "../getContentSummary";
import { useCommunityPageStyles } from "./CommunityPage";
import SectionTitle from "./SectionTitle";

interface InfoPageSectionProps {
  community: Community.AsObject;
}

const useStyles = makeStyles((theme) => ({
  summaryText: {
    marginTop: theme.spacing(1),
  },
}));

export default function InfoPageSection({ community }: InfoPageSectionProps) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  return (
    <section>
      <SectionTitle icon={<InfoIcon />}>{GENERAL_INFORMATION}</SectionTitle>
      <Typography className={classes.summaryText} variant="body1">
        {getContentSummary(community.mainPage?.content)}
      </Typography>

      <div className={classes.loadMoreButton}>
        <Link
          to={routeToCommunity(community.communityId, community.slug, "info")}
        >
          <Button component="span">{SEE_MORE_INFORMATION}</Button>
        </Link>
      </div>
    </section>
  );
}
