#!/bin/bash

# Vercel Ignore Build Step script
# Exit code 0 = cancel build
# Exit code 1 = proceed with build

# 1. Check for [skip vercel] in the commit message
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip vercel]"* ]]; then
  echo "Build cancelled: commit message contains [skip vercel]."
  exit 0
fi

# 2. Only build if files in this workspace (packages/core) changed
git diff HEAD^ HEAD --quiet .

# git diff --quiet returns 1 if there ARE changes (build proceeds)
# git diff --quiet returns 0 if there are NO changes (build cancelled)
