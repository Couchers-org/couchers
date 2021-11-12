import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import ImageInput from "components/ImageInput";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import Snackbar from "components/Snackbar";
import { UPDATE } from "features/constants";
import { communityKey } from "features/queryKeys";
import { Error as GrpcError } from "grpc-web";
import { useRouter } from "next/router";
import { Community } from "proto/communities_pb";
import { Page } from "proto/pages_pb";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { routeToCommunity } from "routes";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import CommunityBase from "./CommunityBase";
import CommunityPageSubHeader from "./CommunityPage/CommunityPageSubHeader";
import {
  COMMUNITY_IMAGE_INPUT_ALT,
  COMMUNITY_PAGE_UPDATED,
  EDIT_LOCAL_INFO,
  PAGE_CONTENT_FIELD_LABEL,
  PAGE_CONTENT_REQUIRED,
  UPLOAD_HELPER_TEXT,
  UPLOAD_HELPER_TEXT_REPLACE,
} from "./constants";
import PageHeader from "./PageHeader";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
  },
  imageUploadhelperText: {
    textAlign: "center",
  },
  form: {
    display: "grid",
    paddingBottom: theme.spacing(5),
    rowGap: theme.spacing(1),
    width: "100%",
  },
  uploadImageButton: {
    justifySelf: "end",
  },
  updateButton: {
    justifySelf: "end",
  },
}));

interface UpdatePageData {
  communityId: string;
  content: string;
  pageId: string;
  communityPhotoKey?: string;
}

export default function EditCommunityPage() {
  const classes = useStyles();
  const queryClient = useQueryClient();
  const { control, handleSubmit, register, errors } = useForm<UpdatePageData>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: updatePage,
  } = useMutation<Page.AsObject, GrpcError, UpdatePageData>(
    ({ communityPhotoKey, content, pageId }) => {
      return service.pages.updatePage({
        content,
        pageId: +pageId,
        photoKey: communityPhotoKey,
      });
    },
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

  const onSubmit = handleSubmit(
    (data) => {
      updatePage(data);
    },
    (errors) => {
      if (errors.communityPhotoKey) {
        window.scroll({ top: 0, behavior: "smooth" });
      }
    }
  );

  const router = useRouter();

  return (
    <CommunityBase>
      {({ community }) => {
        if (typeof window !== undefined && community.mainPage?.canEdit) {
          router.push(
            routeToCommunity(community.communityId, community.slug, "info")
          );
          return null;
        }
        return (
          <>
            <HtmlMeta title={EDIT_LOCAL_INFO} />
            <PageHeader page={community.mainPage!} />
            <CommunityPageSubHeader community={community} tab="info" />
            <PageTitle>{EDIT_LOCAL_INFO}</PageTitle>
            {(error || errors.communityPhotoKey) && (
              <Alert severity="error">
                {error?.message || errors.communityPhotoKey?.message || ""}
              </Alert>
            )}
            <form className={classes.form} onSubmit={onSubmit}>
              <ImageInput
                alt={COMMUNITY_IMAGE_INPUT_ALT}
                control={control}
                id="community-image-input"
                initialPreviewSrc={community.mainPage?.photoUrl || undefined}
                name="communityPhotoKey"
                type="rect"
              />
              <Typography
                className={classes.imageUploadhelperText}
                variant="body1"
              >
                {community.mainPage?.photoUrl
                  ? UPLOAD_HELPER_TEXT_REPLACE
                  : UPLOAD_HELPER_TEXT}
              </Typography>
              <Typography id="content-label" variant="h2">
                {PAGE_CONTENT_FIELD_LABEL}
              </Typography>
              <MarkdownInput
                control={control}
                defaultValue={community.mainPage!.content}
                labelId="content-label"
                id="content"
                name="content"
                imageUpload
                required={PAGE_CONTENT_REQUIRED}
              />
              {errors.content && (
                <Typography color="error" variant="body2">
                  {errors.content.message}
                </Typography>
              )}
              <input
                id="pageId"
                name="pageId"
                type="hidden"
                ref={register}
                value={community.mainPage!.pageId}
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
            {isSuccess && (
              <Snackbar severity="success">{COMMUNITY_PAGE_UPDATED}</Snackbar>
            )}
          </>
        );
      }}
    </CommunityBase>
  );
}
