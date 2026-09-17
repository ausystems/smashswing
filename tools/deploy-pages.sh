#!/bin/sh
# Builds with the GitHub Pages base and pushes /dist to the gh-pages branch.
set -e
SITE_BASE=/smashswing/ npm run build
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git -c user.name=ausystems -c user.email=ausystems.io@gmail.com commit -q -m "Deploy site"
git push -f https://github.com/ausystems/smashswing.git gh-pages
cd .. && rm -rf dist/.git
echo "deployed"
