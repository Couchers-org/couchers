import { Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { ModNote } from "proto/account_pb";

import ModNoteCard from "./ModNoteCard";

interface ModNoteSectionProps {
  pendingModNotes: Array<ModNote.AsObject>;
  updateJailed: () => void;
  className?: string;
}

export default function ModNoteSection({
  pendingModNotes,
  updateJailed,
  className,
}: ModNoteSectionProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("auth:jail.mod_note_section.title")}
      </Typography>
      <Typography variant="body1">
        {t("auth:jail.mod_note_section.description")}
      </Typography>
      {pendingModNotes.map((note) => (
        <ModNoteCard
          key={note.noteId}
          note={note}
          updateJailed={updateJailed}
        />
      ))}
    </div>
  );
}
