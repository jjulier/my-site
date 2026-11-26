#!/bin/sh
# Copies the Link quotes and Wikipedia ideas notes from Obsidian, rebuilds the site, then commits and pushes it.
set -e
cd "$(dirname "$0")"

VAULT="${VAULT:-$HOME/Documents/Obsidian Vault}"
cp "$VAULT/Link quotes.md" data/links.md
cp "$VAULT/Wikipedia ideas.md" data/ideas.md
node build.js

git add data/links.md data/ideas.md links/index.html posters/index.html ideas/
if git diff --cached --quiet; then
  echo "Nothing new to publish"
  exit 0
fi
git commit -m "Update links"
git push
