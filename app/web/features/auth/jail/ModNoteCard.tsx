import { Card, Typography } from "@mui/material";
import Button from "components/Button";
import Markdown from "components/Markdown";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { ModNote } from "proto/account_pb";
import { useState } from "react";
import { service } from "service";
import { dateFormatter, timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  noteContainer: {
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(4),
  },
  noteCard: {
    padding: theme.spacing(0, 2, 2, 2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

interface ModNoteCardProps {
  note: ModNote.AsObject;
  updateJailed: () => void;
}

export default function ModNoteCard({ note, updateJailed }: ModNoteCardProps) {
  const classes = useStyles(makeStyles);
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([AUTH, GLOBAL]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedTime = dateFormatter(locale).format(
    timestamp2Date(note.created!)
  );

  const acknowledge = async () => {
    setLoading(true);
    const info = await service.jail.acknowledgePendingModNote(
      note.noteId,
      true
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
    <div key={note.noteId} className={classes.noteContainer}>
      <Typography variant="h3">
        <Trans t={t} i18nKey="auth:jail.mod_note_section.note_title">
          Mod note received on {{ time: formattedTime }}:
        </Trans>
      </Typography>
      <Card className={classes.noteCard}>
        <Markdown source={note.noteContent} topHeaderLevel={3} />
      </Card>
      <Button loading={loading} onClick={acknowledge} disabled={acknowledged}>
        {acknowledged
          ? t("global:thanks")
          : t("auth:jail.mod_note_section.acknowledge")}
      </Button>
    </div>
  );
}
