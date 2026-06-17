import { Container, ContainerProps } from "@mui/material";

// The platform-standard content width, used by the "standard" layout variant
// in AppRoute and by PageContainer below.
export const STANDARD_PAGE_MAX_WIDTH = "lg" as const;

/**
 * Container capped at the platform-standard page width. Pages that opt out of
 * the standard layout variant (e.g. "full-width" for a full-bleed hero) should
 * wrap their non-full-bleed content in this instead of hardcoding a width.
 */
export default function PageContainer(props: Omit<ContainerProps, "maxWidth">) {
  return <Container maxWidth={STANDARD_PAGE_MAX_WIDTH} {...props} />;
}
