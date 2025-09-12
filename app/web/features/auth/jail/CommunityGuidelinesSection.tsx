import { styled } from "@mui/material";
import React from "react";

import CommunityGuidelines from "@/features/auth/CommunityGuidelines";
import { service } from "@/service";

const StyledCommunityGuidelines = styled(CommunityGuidelines)(() => ({
  maxWidth: "30rem",
}));

interface CommunityGuidelinesSectionProps {
  updateJailed: () => void;
  className?: string;
}

const CommunityGuidelinesSection = ({
  updateJailed,
  className,
}: CommunityGuidelinesSectionProps) => {
  const handleSubmit = async (accept: boolean) => {
    const info = await service.jail.setAcceptedCommunityGuidelines(accept);
    if (!info.isJailed) {
      updateJailed();
    }
  };

  return (
    <StyledCommunityGuidelines
      className={className}
      title="h2"
      onSubmit={handleSubmit}
    />
  );
};

export default CommunityGuidelinesSection;
