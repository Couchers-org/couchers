import { Skeleton, styled } from "@mui/material";
import { CouchIcon } from "components/Icons";
import IconText from "components/IconText";
import { hostingStatusLabels } from "features/profile/constants";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { HostingStatus as THostingStatus } from "proto/api_pb";
import React from "react";

const StyledHostingAbilityContainer = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
}));

export interface HostingStatusProps {
  hostingStatus?: THostingStatus;
}

export default function HostingStatus({ hostingStatus }: HostingStatusProps) {
  const { t } = useTranslation([GLOBAL]);

  return (
    <StyledHostingAbilityContainer>
      {hostingStatus ? (
        <IconText
          icon={CouchIcon}
          text={hostingStatusLabels(t)[hostingStatus]}
        />
      ) : (
        <Skeleton width={100} />
      )}
    </StyledHostingAbilityContainer>
  );
}
