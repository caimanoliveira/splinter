#!/bin/bash
set -e

echo "==> Pulling latest changes..."
git pull origin claude/pet-health-app-CHOix

echo "==> Cleaning node_modules..."
rm -rf node_modules

echo "==> Installing dependencies..."
npm install --legacy-peer-deps

echo "==> Fixing native package versions for SDK 54..."
./node_modules/.bin/expo install \
  react-native \
  react-native-safe-area-context \
  react-native-screens \
  react-native-svg \
  expo-constants \
  expo-notifications \
  expo-file-system \
  expo-image-picker \
  expo-secure-store \
  expo-auth-session \
  expo-web-browser \
  expo-linking \
  expo-linear-gradient

echo "==> Starting Expo..."
./node_modules/.bin/expo start --clear
