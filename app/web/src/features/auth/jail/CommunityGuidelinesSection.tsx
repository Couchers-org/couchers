import classNames from "classnames";
import CommunityGuidelines from "components/CommunityGuidelines/CommunityGuidelines";
import React from "react";
import { service } from "service";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles(() => ({
  root: {
    maxWidth: "30rem",
  },
}));

interface CommunityGuidelinesSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function CommunityGuidelinesSection({
  updateJailed,
  className,
}: CommunityGuidelinesSectionProps) {
  const classes = useStyles();

  const handleSubmit = async (accept: boolean) => {
    const info = await service.jail.setAcceptedCommunityGuidelines(accept);
    if (!info.isJailed) {
      updateJailed();
    }
  };

  return (
    <CommunityGuidelines
      className={classNames(className, classes.root)}
      title="h2"
      onSubmit={handleSubmit}
    />
  );
}
