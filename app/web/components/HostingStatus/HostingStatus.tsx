import { Skeleton, styled } from "@mui/material";
import React from "react";

import IconText from "@/components/IconText";
import { CouchIcon } from "@/components/Icons";
import { hostingStatusLabels } from "@/features/profile/constants";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { HostingStatus as THostingStatus } from "@/proto/api_pb";

const StyledHostingAbilityContainer = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
}));

export interface HostingStatusProps {
  hostingStatus?: THostingStatus;
}

const HostingStatus = ({ hostingStatus }: HostingStatusProps) => {
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
};

export default HostingStatus;
