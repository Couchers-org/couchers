import { Typography } from "@material-ui/core";
import Button from "components/Button";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import Snackbar from "components/Snackbar";
import { UPDATE } from "features/constants";
import { Error as GrpcError } from "grpc-web";
import { Community } from "proto/communities_pb";
import { Page } from "proto/pages_pb";
import { communityKey } from "queryKeys";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { Redirect } from "react-router-dom";
import { routeToCommunity } from "routes";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import CommunityBase from "./CommunityBase";
import {
  COMMUNITY_PAGE_UPDATED,
  EDIT_COMMUNITY_PAGE,
  PAGE_CONTENT_FIELD_LABEL,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
  },
  form: {
    display: "grid",
    paddingBottom: theme.spacing(5),
    rowGap: theme.spacing(1),
    width: "100%",
  },
  updateButton: {
    justifySelf: "end",
  },
}));

interface UpdatePageData {
  communityId: string;
  content: string;
  pageId: string;
}

export default function EditCommunityPage() {
  const classes = useStyles();
  const queryClient = useQueryClient();
  const { control, handleSubmit, register } = useForm<UpdatePageData>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: updatePage,
  } = useMutation<Page.AsObject, GrpcError, UpdatePageData>(
    ({ content, pageId }) =>
      service.pages.updatePage({ content, pageId: +pageId }),
    {
      onSuccess(newPageData, { communityId }) {
        queryClient.setQueryData<Community.AsObject | undefined>(
          communityKey(+communityId),
          (community) =>
            community
              ? {
                  ...community,
                  mainPage: newPageData,
                }
              : undefined
        );
        queryClient.invalidateQueries(communityKey(+communityId));
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    // update page mutation
    console.log(data);
    updatePage(data);
  });

  return (
    <CommunityBase>
      {({ community }) => {
        return community.mainPage?.canEdit ? (
          <>
            <PageTitle>{EDIT_COMMUNITY_PAGE}</PageTitle>
            <form className={classes.form} onSubmit={onSubmit}>
              <Typography id="content-label" variant="h2">
                {PAGE_CONTENT_FIELD_LABEL}
              </Typography>
              <MarkdownInput
                control={control}
                defaultValue={community.mainPage.content}
                labelId="content-label"
                id="content"
                name="content"
              />
              <input
                id="pageId"
                name="pageId"
                type="hidden"
                ref={register}
                value={community.mainPage.pageId}
              />
              <input
                id="communityId"
                name="communityId"
                type="hidden"
                ref={register}
                value={community.communityId}
              />
              <Button
                loading={isLoading}
                className={classes.updateButton}
                type="submit"
              >
                {UPDATE}
              </Button>
            </form>
            {error && <Snackbar severity="error">{error.message}</Snackbar>}
            {isSuccess && (
              <Snackbar severity="success">{COMMUNITY_PAGE_UPDATED}</Snackbar>
            )}
          </>
        ) : (
          <Redirect
            to={routeToCommunity(community.communityId, community.slug, "info")}
          />
        );
      }}
    </CommunityBase>
  );
}
