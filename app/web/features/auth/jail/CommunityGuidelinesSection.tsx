import { styled } from "@mui/styles";
import CommunityGuidelines from "features/auth/CommunityGuidelines";
import React from "react";
import { service } from "service";

const StyledCommunityGuidelines = styled(CommunityGuidelines)(() => ({
  maxWidth: "30rem",
}));

interface CommunityGuidelinesSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function CommunityGuidelinesSection({
  updateJailed,
  className,
}: CommunityGuidelinesSectionProps) {
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
}
