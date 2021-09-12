import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import Snackbar from "components/Snackbar";
import EditPageHeaderImage from "features/communities/EditPageHeaderImage";
import { UPDATE } from "features/constants";
import { useForm } from "react-hook-form";
import { Redirect } from "react-router-dom";
import { routeToCommunity } from "routes";
import makeStyles from "utils/makeStyles";
import { FormDataValues } from "utils/types";

import CommunityBase from "./CommunityBase";
import CommunityPageSubHeader from "./CommunityPage/CommunityPageSubHeader";
import {
  COMMUNITY_IMAGE_INPUT_ALT,
  COMMUNITY_PAGE_UPDATED,
  EDIT_LOCAL_INFO,
  PAGE_CONTENT_FIELD_LABEL,
  PAGE_CONTENT_REQUIRED,
} from "./constants";
import { UpdatePageData, useUpdatePage } from "./hooks";

const useStyles = makeStyles((theme) => ({
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

export default function EditCommunityPage() {
  const classes = useStyles();
  const { control, handleSubmit, register, errors } =
    useForm<FormDataValues<UpdatePageData>>();
  const { mutate: updatePage, error, isLoading, isSuccess } = useUpdatePage();

  const onSubmit = handleSubmit(
    ({ communityId, pageId, ...data }) => {
      updatePage({
        ...data,
        communityId: +communityId,
        pageId: +pageId,
      });
    },
    (errors) => {
      if (errors.photoKey) {
        window.scroll({ top: 0, behavior: "smooth" });
      }
    }
  );

  return (
    <CommunityBase>
      {({ community }) => {
        return community.mainPage?.canEdit ? (
          <>
            <EditPageHeaderImage
              alt={COMMUNITY_IMAGE_INPUT_ALT}
              initialPreviewSrc={community.mainPage?.photoUrl || undefined}
              type="rect"
              onSuccess={(data) =>
                community.mainPage &&
                updatePage({
                  photoKey: data.key,
                  communityId: community.communityId,
                  pageId: community.mainPage?.pageId,
                })
              }
            />
            <CommunityPageSubHeader community={community} />
            <PageTitle>{EDIT_LOCAL_INFO}</PageTitle>
            {(error || errors.photoKey) && (
              <Alert severity="error">
                {error?.message || errors.photoKey?.message || ""}
              </Alert>
            )}
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
