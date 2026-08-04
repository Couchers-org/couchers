#!/bin/sh
# Checks that a built web image actually serves translations.
#
# Locale JSON only reaches the runtime image through .next/standalone file tracing - the
# runner stage of Dockerfile.prod copies no locale directory. `next build` still passes when
# that breaks, because the builder stage has the files on disk either way. So this asks a
# running container for a fallback:"blocking" route, where getStaticProps runs at request
# time and does the real filesystem read.
#
# Usage: ./app/web/ci-i18n-smoke.sh <image-tag>
set -eu

IMAGE="${1:?usage: ci-i18n-smoke.sh <image-tag>}"
NAME="i18n-smoke-$$"
ROUTE="http://127.0.0.1:3000/user/anyone"
ATTEMPTS=45

trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

docker run -d --name "$NAME" "$IMAGE" >/dev/null

# curl isn't in the slim runtime image, so use the node that's already there. Requesting from
# inside the container also avoids relying on port publishing, which is unreliable under
# docker-in-docker runners.
i=0
while [ "$i" -lt "$ATTEMPTS" ]; do
  if docker exec "$NAME" node -e "
    fetch('$ROUTE')
      .then((r) => r.text())
      .then((html) => process.exit(html.includes('initialI18nStore') ? 0 : 1))
      .catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "i18n smoke test: OK"
    exit 0
  fi
  i=$((i + 1))
  sleep 2
done

echo "i18n smoke test FAILED: $ROUTE served no initialI18nStore after $((ATTEMPTS * 2))s." >&2
echo "The image is serving pages without translations. Check that" >&2
echo "outputFileTracingIncludes in app/web/next.config.js still matches" >&2
echo "localePath in app/web/next-i18next.config.js." >&2
docker logs --tail 30 "$NAME" >&2 || true
exit 1
