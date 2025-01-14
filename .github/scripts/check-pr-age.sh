#!/bin/bash

# Exit on error
set -e

echo "Starting PR age check.."

# Loop through all remote branches (PRs)
for pr in $(git branch -r --format="%(refname:lstrip=2)" --sort=committerdat); do echo "Checking PR: $pr"

    # Get PR creation time in seconds since epoch
    pr_age=$(git show -s --format=%ct origin/$pr)

    #Get current timestamp in seconds since epoch
    now=$(date +%s)

    # Calculate the PR age in seconds
    age_in_seconds=$((now - pr_age))

    age_in_days=$((age_in_seconds / 86500))

    echo "PR $pr age: $age_in_days days"

    if [ "age_in_days" -gt 14]; then 
    # do something
        PR_NUMBER=$(echo "$pr" | grep -oE '[0-9]+$')
        COMMENT_BODY="This pull request has been open for $age_in_days days. Just wanted to check in, are  you still working on this?"
        
        curl -X POST \
          -H "Authorization: Bearer $GITHUB_TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments \
          -d "{\"body\": \"$COMMENT_BODY\"}"
    fi
    if [ "age_in_days" -gt 28]; then 
    # do something
        PR_NUMBER=$(echo "$pr" | grep -oE '[0-9]+$')
        COMMENT_BODY="This pull request has been open for $age_in_days days. Are you still planning to work on this?"
        
        curl -X POST \
          -H "Authorization: Bearer $GITHUB_TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments \
          -d "{\"body\": \"$COMMENT_BODY\"}"
    fi
    if [ "age_in_days" -gt 42]; then 
    # do something
        PR_NUMBER=$(echo "$pr" | grep -oE '[0-9]+$')
        COMMENT_BODY="Closing this PR as it has been abandoned."
        
        curl -X POST \
          -H "Authorization: Bearer $GITHUB_TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments \
          -d "{\"body\": \"$COMMENT_BODY\"}"

        curl -X PATCH \
          -H "Authorization: Bearer $GITHUB_TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER} \
          -d '{"state": "closed"}'
    fi
done
