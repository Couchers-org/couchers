import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Skeleton, styled, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import Markdown from "components/Markdown";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import RelativeTime from "components/RelativeTime";
import TextField from "components/TextField";
import { contentRefs } from "features/contentRefs";
import FlagButton from "features/FlagButton";
import { discussionKey } from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { localizeDateOnly } from "i18n/datetimes";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Discussion } from "proto/discussions_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";
import { timestampToPlainDateTime } from "utils/date";

import { sendNativeBack, useIsNativeEmbed } from "../../../utils/nativeLink";
import CommunityBase from "../CommunityBase";
import CommunityPageSubHeader from "../CommunityPage/CommunityPageSubHeader";
import PageHeader from "../PageHeader";
import CommentTree from "./CommentTree";
import DeleteDiscussionDialog from "./DeleteDiscussionDialog";

interface EditDiscussionFormData {
  title: string;
  content: string;
}

const StyledPageHeader = styled(PageHeader)(() => ({
  alignItems: "center",
  display: "flex",
}));

const StyledDiscussionBodyWrapper = styled("div")(() => ({
  paddingBlockEnd: theme.spacing(5),
}));

const StyledTitleRow = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
  marginBlock: theme.spacing(1),
}));

const StyledDiscussionContent = styled(Markdown)(() => ({
  marginBlockEnd: theme.spacing(3),
}));

const StyledCreatorRow = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  gap: theme.spacing(2),
}));

const StyledAvatar = styled(Avatar)(() => ({
  height: "3rem",
  width: "3rem",
}));

const StyledCreatorDetailsContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
}));

const StyledDeletedMessage = styled(Typography)(() => ({
  color: "var(--mui-palette-text-secondary)",
  fontStyle: "italic",
}));

const StyledEditForm = styled("form")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(3),
  },
}));

const StyledActionButtons = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(1),
  justifyContent: "flex-end",
}));

const StyledTitleRowButtons = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
}));

export const CREATOR_TEST_ID = "creator";

export default function DiscussionPage({ discussionId }: { discussionId: number }) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();
  const queryClient = useQueryClient();

  const [ellipsisMenuAnchorEl, setEllipsisMenuAnchorEl] = useState<Element | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isEllipsisMenuOpen = Boolean(ellipsisMenuAnchorEl);

  const {
    data: discussion,
    error,
    isLoading: isDiscussionLoading,
  } = useQuery<Discussion.AsObject, RpcError>({
    queryKey: discussionKey(discussionId),
    queryFn: () => service.discussions.getDiscussion(discussionId),
  });

  const { data: discussionCreator, isLoading: isCreatorLoading } = useLiteUser(
    discussion?.deleted ? undefined : discussion?.creatorUserId,
  );

  const { control, handleSubmit, register, reset } = useForm<EditDiscussionFormData>({
    mode: "onBlur",
    values: discussion ? { title: discussion.title, content: discussion.content } : undefined,
  });

  const {
    mutate: updateDiscussion,
    error: updateError,
    isPending: isUpdating,
  } = useMutation<Discussion.AsObject, RpcError, EditDiscussionFormData>({
    mutationFn: ({ title, content }) => service.discussions.updateDiscussion(discussionId, title, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(discussionId) });
      setIsEditing(false);
    },
  });

  const handleBackClick = () => {
    if (isNativeEmbed) {
      sendNativeBack();
      return;
    }
    router.back();
  };

  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
  };

  const ellipsisMenuItems: EllipsisMenuItem[] = [
    ...(discussion?.canEdit && !discussion.deleted
      ? ([
          {
            icon: EditOutlined,
            label: t("communities:edit_discussion"),
            onClick: () => setIsEditing(true),
            id: "edit-discussion",
          },
        ] as EllipsisMenuItem[])
      : []),
    ...(discussion?.canEdit && !discussion?.deleted
      ? ([
          {
            icon: DeleteOutlined,
            label: t("communities:delete_discussion"),
            onClick: () => setDeleteDialogOpen(true),
            id: "delete-discussion",
          },
        ] as EllipsisMenuItem[])
      : []),
  ];

  return (
    <>
      <HtmlMeta title={discussion?.title} />
      {error && <Alert severity="error">{error.message}</Alert>}
      {isDiscussionLoading ? (
        <CenteredSpinner />
      ) : (
        discussion && (
          <CommunityBase communityId={discussion.ownerCommunityId}>
            {({ community }) => (
              <>
                {community.mainPage && <StyledPageHeader page={community.mainPage} />}
                <CommunityPageSubHeader community={community} tab="discussions" />
                <StyledDiscussionBodyWrapper>
                  <HeaderButton onClick={handleBackClick} aria-label={t("communities:previous_page")}>
                    <BackIcon />
                  </HeaderButton>
                  <StyledTitleRow>
                    <PageTitle>{discussion.deleted ? t("communities:discussion_deleted") : discussion.title}</PageTitle>
                    {!isEditing && (
                      <StyledTitleRowButtons>
                        {!discussion.deleted && (
                          <FlagButton
                            contentRef={contentRefs.discussion(discussion)}
                            authorUser={discussion.creatorUserId}
                            ariaLabel={t("communities:report_discussion_button_a11y")}
                          />
                        )}
                        {ellipsisMenuItems.length > 0 && (
                          <EllipsisMenu
                            idName="discussion-page"
                            isMenuOpen={isEllipsisMenuOpen}
                            menuAnchorEl={ellipsisMenuAnchorEl}
                            onMenuOpen={(e) => setEllipsisMenuAnchorEl(e.currentTarget)}
                            onMenuClose={() => setEllipsisMenuAnchorEl(null)}
                            items={ellipsisMenuItems}
                          />
                        )}
                      </StyledTitleRowButtons>
                    )}
                  </StyledTitleRow>
                  <div>
                    {discussion.deleted ? (
                      <StyledDeletedMessage variant="body1">{t("communities:discussion_deleted")}</StyledDeletedMessage>
                    ) : isEditing ? (
                      <StyledEditForm onSubmit={handleSubmit((data) => updateDiscussion(data))}>
                        {updateError && <Alert severity="error">{updateError.message}</Alert>}
                        <TextField
                          id="title"
                          {...register("title", { required: true })}
                          fullWidth
                          label={t("communities:new_discussion_title")}
                        />
                        <Typography id="content-label" variant="h3">
                          {t("communities:new_discussion_topic")}
                        </Typography>
                        <MarkdownInput
                          control={control}
                          defaultValue={discussion.content}
                          id="content"
                          labelId="content-label"
                          name="content"
                        />
                        <StyledActionButtons>
                          <Button variant="outlined" onClick={handleCancelEdit}>
                            {t("global:cancel")}
                          </Button>
                          <Button loading={isUpdating} type="submit">
                            {t("global:save")}
                          </Button>
                        </StyledActionButtons>
                      </StyledEditForm>
                    ) : (
                      <>
                        <StyledDiscussionContent source={discussion.content} />
                        <StyledCreatorRow data-testid={CREATOR_TEST_ID}>
                          <StyledAvatar user={discussionCreator} />
                          <StyledCreatorDetailsContainer>
                            {isCreatorLoading ? (
                              <Skeleton width={100} />
                            ) : (
                              <Typography variant="body1">
                                {discussionCreator?.name ?? t("communities:unknown_user")}
                              </Typography>
                            )}
                            {isCreatorLoading ? (
                              <Skeleton width={100} />
                            ) : (
                              <Typography variant="body2">
                                {t("communities:discussion_creation_date", {
                                  dateOnly: localizeDateOnly(timestampToPlainDateTime(discussion.created!), locale),
                                })}
                              </Typography>
                            )}
                            {discussion.lastEdited && (
                              <Typography variant="body2">
                                <Trans
                                  t={t}
                                  i18nKey="communities:discussion_edited_date2"
                                  components={{
                                    timeAgo: <RelativeTime instant={discussion.lastEdited} />,
                                  }}
                                />
                              </Typography>
                            )}
                          </StyledCreatorDetailsContainer>
                        </StyledCreatorRow>
                      </>
                    )}
                  </div>
                  <Typography variant="h2">{t("communities:comments")}</Typography>
                  <CommentTree threadId={discussion.thread!.threadId} discussionId={discussionId} />
                </StyledDiscussionBodyWrapper>
                <DeleteDiscussionDialog
                  discussionId={discussionId}
                  open={deleteDialogOpen}
                  onClose={() => setDeleteDialogOpen(false)}
                />
              </>
            )}
          </CommunityBase>
        )
      )}
    </>
  );
}
