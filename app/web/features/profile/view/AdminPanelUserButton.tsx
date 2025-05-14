import IconButton from "components/IconButton";
import { SettingsIcon } from "components/Icons";
import ModVisibleComponent from "features/mod/ModVisibleComponent";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import React from "react";
import { adminPanelUserLink } from "routes";

export interface AdminPanelUserButtonProps {
  username: string;
}

export default function AdminPanelUserButton({
  username,
}: AdminPanelUserButtonProps) {
  const { t } = useTranslation(PROFILE);
  const router = useRouter();

  return (
    <ModVisibleComponent>
      <IconButton
        aria-label={t("view_in_admin_console")}
        onClick={() => router.push(adminPanelUserLink(username))}
        color="primary"
      >
        <SettingsIcon />
      </IconButton>
    </ModVisibleComponent>
  );
}
