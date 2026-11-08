export function getTargetingAttributes(
  userId: number | null,
  attributesJson: string | undefined,
): Record<string, unknown> {
  if (userId == null) return {};
  const id = userId.toString();
  const attributes = attributesJson ? (JSON.parse(attributesJson) as Record<string, unknown>) : {};
  // The persisted query cache can still hold account info from a previously logged-in user
  return attributes.id === id ? attributes : { id };
}
