#!/bin/bash

if echo "" | grep -q '\[skip vercel\]'; then
  echo "Skipping build due to [skip vercel] flag."
  exit 0
fi

git diff HEAD^ HEAD --quiet .
