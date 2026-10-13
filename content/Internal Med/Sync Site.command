#!/bin/zsh
# Double-click in Finder to sync the Obsidian vault to the website
# (commits, pulls, and pushes; GitHub then rebuilds and deploys the site).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "/Users/Omar/Projects/obsidian-internalmed" || exit 1

echo "Syncing site..."
echo
if npx quartz sync; then
  echo
  echo "✅ Done. The site will update in a couple of minutes:"
  echo "   https://github.com/sleepyclef/obsidian-internalmed/actions"
else
  echo
  echo "❌ Sync failed — see the messages above."
fi
echo
read -k 1 "?Press any key to close..."
