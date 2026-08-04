#!/bin/bash

# Vercel Ignore Build Step script
# Exit code 0 = cancel build
# Exit code 1 = proceed with build

# 1. Check for [skip vercel] in the commit message
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip vercel]"* ]]; then
  echo "Build cancelled: commit message contains [skip vercel]."
  exit 0
fi

# 2. Try to diff against the previous commit. 
# If HEAD^ doesn't exist (e.g., new deployment), git diff returns an error code.
# If there are changes, it returns 1. 
# We want to cancel the build (exit 0) ONLY if it successfully proves there are no changes.
if git diff HEAD^ HEAD --quiet . 2>/dev/null; then
  echo "Build cancelled: no changes detected in packages/core."
  exit 0
else
  echo "Build proceeding: changes detected or unable to compare (e.g., new deployment)."
  exit 1
fi
