#!/bin/bash
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "Generating Prisma client..."
npx prisma generate

echo "Done! Please restart your dev server."
