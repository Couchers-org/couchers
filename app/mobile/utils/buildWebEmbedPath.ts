/**
 * Builds a path with query parameters for WebEmbed component
 * Handles both single values and arrays (e.g., multiple bbox or hostingStatus params)
 */
export function buildWebEmbedPath(
  basePath: string,
  params: Record<string, string | string[] | undefined>,
): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v) queryParams.append(key, v);
      });
    } else if (value) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
