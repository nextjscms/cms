#!/bin/bash

# Vercel Ignore Build Step script
# Exit code 0 = cancel build
# Exit code 1 = proceed with build

# 1. Check for [skip vercel] in the commit message
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip vercel]"* ]]; then
  echo "Build cancelled: commit message contains [skip vercel]."
  exit 0
fi

# 2. Use Vercel's provided environment variables to check for changes securely
if [[ -n "$VERCEL_GIT_PREVIOUS_SHA" && -n "$VERCEL_GIT_COMMIT_SHA" ]]; then
  # Compare the previous commit to the new one for this specific directory
  if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" . 2>/dev/null; then
    echo "Build cancelled: no changes detected in packages/core."
    exit 0
  else
    echo "Build proceeding: changes detected in packages/core."
    exit 1
  fi
else
  # Fallback for manual deployments, first deployments, or missing variables
  echo "Build proceeding: unable to compare commits securely."
  exit 1
fi
