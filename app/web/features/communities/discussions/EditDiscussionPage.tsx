import { Card, styled, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import MarkdownInput from "components/MarkdownInput";
import TextField from "components/TextField";
import { discussionKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Discussion } from "proto/discussions_pb";
import { useForm } from "react-hook-form";
import { routeToDiscussion } from "routes";
import { service } from "service";
import { theme } from "theme";
import { sendNativeBack, useIsNativeEmbed } from "utils/nativeLink";

const StyledWrapper = styled(Card)(() => ({
  "& > :not(:last-child)": {
    marginBlockEnd: theme.spacing(3),
  },
  padding: theme.spacing(3),
}));

const StyledForm = styled("form")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(3),
  },
}));

const StyledActionButtonsContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
}));

interface EditDiscussionFormData {
  title: string;
  content: string;
}

export default function EditDiscussionPage({
  discussionId,
}: {
  discussionId: number;
}) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();
  const queryClient = useQueryClient();

  const {
    data: discussion,
    error: loadError,
    isLoading,
  } = useQuery<Discussion.AsObject, RpcError>({
    queryKey: discussionKey(discussionId),
    queryFn: () => service.discussions.getDiscussion(discussionId),
  });

  const { control, handleSubmit, register } = useForm<EditDiscussionFormData>({
    mode: "onBlur",
    values: discussion
      ? { title: discussion.title, content: discussion.content }
      : undefined,
  });

  const {
    mutate: updateDiscussion,
    error: mutationError,
    isPending,
  } = useMutation<Discussion.AsObject, RpcError, EditDiscussionFormData>({
    mutationFn: ({ title, content }) =>
      service.discussions.updateDiscussion(discussionId, title, content),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: discussionKey(discussionId) });
      router.push(routeToDiscussion(discussionId, updated.slug));
    },
  });

  const handleBackClick = () => {
    if (isNativeEmbed) {
      sendNativeBack();
      return;
    }
    router.back();
  };

  const onSubmit = handleSubmit((data) => {
    updateDiscussion(data);
  });

  return (
    <>
      <HtmlMeta title={t("communities:edit_discussion")} />
      <HeaderButton onClick={handleBackClick} aria-label={t("global:back")}>
        <BackIcon />
      </HeaderButton>
      {loadError && <Alert severity="error">{loadError.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        discussion && (
          <StyledWrapper>
            <Typography variant="h2">
              {t("communities:edit_discussion")}
            </Typography>
            {mutationError && (
              <Alert severity="error">{mutationError.message}</Alert>
            )}
            <StyledForm onSubmit={onSubmit}>
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
                id="content"
                labelId="content-label"
                name="content"
              />
              <StyledActionButtonsContainer>
                <Button variant="outlined" onClick={handleBackClick}>
                  {t("global:cancel")}
                </Button>
                <Button loading={isPending} type="submit">
                  {t("global:save")}
                </Button>
              </StyledActionButtonsContainer>
            </StyledForm>
          </StyledWrapper>
        )
      )}
    </>
  );
}
