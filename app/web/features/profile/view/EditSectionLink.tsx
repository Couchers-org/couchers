import { EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { EditUserTab, routeToEditProfile } from "routes";

interface EditSectionLinkProps {
  // whose profile the section belongs to; the link only shows on your own
  userId: number;
  tab: EditUserTab;
  // id of the section or field on the edit page
  sectionId: string;
  sectionName: string;
}

export default function EditSectionLink({ userId, tab, sectionId, sectionName }: EditSectionLinkProps) {
  const { t } = useTranslation([PROFILE]);
  const isOwnProfile = useAuthContext().authState.userId === userId;
  if (!isOwnProfile) return null;

  return (
    <IconButton
      component={Link}
      href={`${routeToEditProfile(tab)}#${sectionId}`}
      size="small"
      color="primary"
      aria-label={t("profile:edit_section_button_a11y", { section_name: sectionName })}
    >
      <EditOutlined sx={{ fontSize: 18 }} />
    </IconButton>
  );
}
