#!/bin/bash

# This script verifies a deployment by checking the /api/status endpoint.
# It takes two arguments:
# 1. The revision ($rev) to check against for the 'version' field.
# 2. The base URL of the deployment (e.g., https://next.couchershq.org).

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <revision> <base_url>"
    echo "Example: $0 develop-24532dd9 https://next.couchershq.org"
    exit 1
fi

REV_TO_CHECK="$1"
BASE_URL="$2"
API_URL="${BASE_URL}/api/status" # Construct the full API URL

# Ensure `jq` is installed
if ! command -v jq &> /dev/null
then
    echo "Error: jq is not installed. Please install it to run this script." >&2
    exit 1
fi

echo "Verifying deployment at $BASE_URL (expected version: $REV_TO_CHECK)..."
MAX_ATTEMPTS=$((5 * 60 / 2)) # 5 minutes / 2 seconds per attempt
ATTEMPT=0
SUCCESS=false

while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS..."

    # Capture curl output and status
    CURL_OUTPUT=$(curl -s -w "%{http_code}" "$API_URL")
    HTTP_CODE="${CURL_OUTPUT: -3}" # Last 3 chars are HTTP code (space before -3 for macOS bash compatibility)
    STATUS_JSON="${CURL_OUTPUT:0:${#CURL_OUTPUT}-3}" # Everything before the last 3 chars is JSON

    echo "  HTTP Code: $HTTP_CODE"
    # Print part of response for debugging, but be careful with very large responses
    echo "  Raw JSON response snippet: ${STATUS_JSON:0:200}..."

    # Initialize variables for this attempt
    VERSION=""
    COUCHER_COUNT=0

    # Check curl and HTTP status first
    if [ "$HTTP_CODE" -ne 200 ]; then
        echo "  API returned non-200 HTTP status code: $HTTP_CODE"
    elif [ -z "$STATUS_JSON" ]; then
        echo "  Received empty response from API. This might indicate a service issue."
    else
        # Attempt to parse with jq. Errors will be printed to stderr.
        if PARSED_VERSION=$(echo "$STATUS_JSON" | jq -r '.version // empty'); then
            if PARSED_COUCHER_COUNT=$(echo "$STATUS_JSON" | jq -r '.coucherCount // "0"'); then
                # Both jq extractions were successful
                VERSION="$PARSED_VERSION"
                # Check if COUCHER_COUNT is numeric
                if [[ "$PARSED_COUCHER_COUNT" =~ ^[0-9]+$ ]]; then
                    COUCHER_COUNT="$PARSED_COUCHER_COUNT"
                else
                    echo "  Warning: coucherCount value '$PARSED_COUCHER_COUNT' is not a valid number. Defaulting to 0 for comparison."
                    COUCHER_COUNT=0
                fi
            else
                echo "  jq failed to extract 'coucherCount' from JSON. Check format."
            fi
        else
            echo "  jq failed to extract 'version'. This often means malformed JSON."
        fi
    fi

    EXPECTED_VERSION="$REV_TO_CHECK"

    # Perform the checks. COUCHER_COUNT will be 0 if parsing failed or it wasn't numeric.
    if [ "$VERSION" = "$EXPECTED_VERSION" ] && [ "$COUCHER_COUNT" -gt 100 ]; then
        echo "Deployment verification successful at $BASE_URL!"
        echo "  Version: $VERSION (Expected: $EXPECTED_VERSION)"
        echo "  Coucher Count: $COUCHER_COUNT (> 100)"
        SUCCESS=true
        break # Exit loop on success
    else
        echo "Verification failed for this attempt at $BASE_URL:"
        echo "  Current Version: '$VERSION' (Expected: '$EXPECTED_VERSION')"
        echo "  Current Coucher Count: '$COUCHER_COUNT' (Expected: > 100)"
    fi

    sleep 2
done

if [ "$SUCCESS" = false ]; then
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
    echo "!!!                                                      !!!" >&2
    echo "!!!   DEPLOYMENT VERIFICATION FAILED AFTER 5 MINS AT:    !!!" >&2
    echo "!!!             $BASE_URL              !!!" >&2
    echo "!!!                                                      !!!" >&2
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
    exit 1
else
    exit 0
fi
