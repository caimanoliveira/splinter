#!/bin/bash
set -e

echo "==> Pulling latest changes..."
git pull origin claude/pet-health-app-CHOix

echo "==> Cleaning node_modules..."
rm -rf node_modules

echo "==> Installing dependencies..."
npm install --legacy-peer-deps

echo "==> Starting Expo..."
./node_modules/.bin/expo start --clear
