import { Card, styled, Typography } from "@mui/material";
import Button from "components/Button";
import Markdown from "components/Markdown";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { ModNote } from "proto/account_pb";
import { useState } from "react";
import { service } from "service";
import { theme } from "theme";
import { BROWSER_TIMEZONE, localizeDateTime, timestamp2Date } from "utils/date";

const StyledNoteContainer = styled("div")(() => ({
  marginBottom: theme.spacing(4),
  marginTop: theme.spacing(4),
}));

const StyledNoteCard = styled(Card)(() => ({
  padding: theme.spacing(0, 2, 2, 2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

interface ModNoteCardProps {
  note: ModNote.AsObject;
  updateJailed: () => void;
}

export default function ModNoteCard({ note, updateJailed }: ModNoteCardProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([AUTH, GLOBAL]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedTime = localizeDateTime(timestamp2Date(note.created!), {
    timezone: BROWSER_TIMEZONE,
    locale,
    abbreviate: true,
  });

  const acknowledge = async () => {
    setLoading(true);
    const info = await service.jail.acknowledgePendingModNote(
      note.noteId,
      true,
    );
    if (!info.isJailed) {
      updateJailed();
    } else {
      // if user is no longer jailed, this component will be unmounted anyway
      setLoading(false);
      setAcknowledged(true);
    }
  };

  return (
    <StyledNoteContainer key={note.noteId}>
      <Typography variant="h3">
        <Trans t={t} i18nKey="auth:jail.mod_note_section.note_title">
          Moderator note received on {{ time: formattedTime }}:
        </Trans>
      </Typography>
      <StyledNoteCard>
        <Markdown source={note.noteContent} topHeaderLevel={3} />
      </StyledNoteCard>
      <Button loading={loading} onClick={acknowledge} disabled={acknowledged}>
        {acknowledged
          ? t("global:thanks")
          : t("auth:jail.mod_note_section.acknowledge")}
      </Button>
    </StyledNoteContainer>
  );
}
