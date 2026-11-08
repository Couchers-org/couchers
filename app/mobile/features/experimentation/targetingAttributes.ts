export function getTargetingAttributes(
  userId: number | null,
  attributesJson: string | undefined,
): Record<string, unknown> {
  if (userId == null) return {};
  const id = userId.toString();
  const attributes = attributesJson
    ? (JSON.parse(attributesJson) as Record<string, unknown>)
    : {};
  // Account info fetched for a previously logged-in user may arrive after the user changed
  return attributes.id === id ? attributes : { id };
}
