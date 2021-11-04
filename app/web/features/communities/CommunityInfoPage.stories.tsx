import { Meta, Story } from "@storybook/react";
import { mockedService } from "stories/serviceMocks";
import community from "test/fixtures/community.json";
import makeStyles from "utils/makeStyles";

import CommunityInfoPage from "./CommunityInfoPage";

export default {
  component: CommunityInfoPage,
  title: "Communities/CommunityPage/CommunityInfoPage",
} as Meta;

const useStyles = makeStyles((theme) => ({
  root: {
    "& section": {
      margin: theme.spacing(3, 0),
    },
  },
}));

interface CommunityInfoArgs {
  shouldSucceed?: boolean;
}

const Template: Story<CommunityInfoArgs> = ({ shouldSucceed = true } = {}) => {
  const classes = useStyles();
  setMocks({ shouldSucceed });
  return (
    <div className={classes.root}>
      <CommunityInfoPage community={community} />
    </div>
  );
};

export const CommunityInfo = Template.bind({});

export const ErrorGettingModerators = Template.bind({});
ErrorGettingModerators.args = {
  shouldSucceed: false,
};

function setMocks({ shouldSucceed }: Required<CommunityInfoArgs>) {
  mockedService.communities.listAdmins = async (_, pageToken) =>
    shouldSucceed
      ? {
          adminUserIdsList: pageToken ? [4] : [2, 3],
          nextPageToken: pageToken ? "" : "3",
        }
      : Promise.reject(new Error("Error getting community admins"));
}
