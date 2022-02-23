import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import ImageInput from "components/ImageInput";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import Redirect from "components/Redirect";
import Snackbar from "components/Snackbar";
import { UPDATE } from "features/constants";
import { communityKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { Page } from "proto/pages_pb";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { routeToCommunity } from "routes";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import CommunityBase from "./CommunityBase";

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

export default function EditCommunityPage({
  communityId,
}: {
  communityId: number;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useStyles();
  const queryClient = useQueryClient();
  const { control, handleSubmit, register, errors } = useForm<UpdatePageData>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: updatePage,
  } = useMutation<Page.AsObject, RpcError, UpdatePageData>(
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

  return (
    <CommunityBase communityId={communityId}>
      {({ community }) => {
        return community.mainPage?.canEdit ? (
          <>
            <HtmlMeta title={t("communities:edit_info_page_title")} />
            <PageTitle>{t("communities:edit_info_page_title")}</PageTitle>
            {(error || errors.communityPhotoKey) && (
              <Alert severity="error">
                {error?.message || errors.communityPhotoKey?.message || ""}
              </Alert>
            )}
            <form className={classes.form} onSubmit={onSubmit}>
              <ImageInput
                alt={t("communities:community_image_input_alt")}
                control={control}
                id="community-image-input"
                initialPreviewSrc={community.mainPage.photoUrl || undefined}
                name="communityPhotoKey"
                type="rect"
              />
              <Typography
                className={classes.imageUploadhelperText}
                variant="body1"
              >
                {community.mainPage.photoUrl
                  ? t("communities:upload_helper_text_replace")
                  : t("communities:upload_helper_text")}
              </Typography>
              <Typography id="content-label" variant="h2">
                {t("communities:page_content_field_label")}
              </Typography>
              <MarkdownInput
                control={control}
                defaultValue={community.mainPage.content}
                labelId="content-label"
                id="content"
                name="content"
                imageUpload
                required={t("communities:page_content_required")}
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
            {isSuccess && (
              <Snackbar severity="success">
                {t("communities:community_page_updated")}
              </Snackbar>
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
