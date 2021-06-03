import { Typography } from "@material-ui/core";
import { InfoIcon } from "components/Icons";
import { Community } from "pb/communities_pb";
import makeStyles from "utils/makeStyles";

import { SectionTitle } from "./CommunityPage";
import { GENERAL_INFORMATION } from "./constants";

const useStyles = makeStyles((theme) => ({
  summaryText: {
    marginTop: theme.spacing(1),
  },
}));

interface CommunityInfoPageProps {
  community: Community.AsObject;
}

export default function CommunityInfoPage({
  community,
}: CommunityInfoPageProps) {
  const classes = useStyles();

  return (
    <>
      <SectionTitle icon={<InfoIcon />}>{GENERAL_INFORMATION}</SectionTitle>
      <Typography className={classes.summaryText} variant="body1">
        {community.mainPage?.content}
      </Typography>
    </>
  );
}
