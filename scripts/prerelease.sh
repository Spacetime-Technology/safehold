#!/bin/bash
set -e

branch=$(git branch --show-current)
[ "$branch" = "main" ] || { echo "error: on branch '$branch', must be on main"; exit 1; }

[ -z "$(git status --porcelain)" ] || { echo "error: working tree is dirty — commit or stash first"; exit 1; }

git fetch origin main --quiet
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "error: not up to date with origin/main — pull first"; exit 1; }

echo "checks passed"
