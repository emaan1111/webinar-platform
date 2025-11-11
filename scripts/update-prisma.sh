#!/bin/bash

echo "🔧 Regenerating Prisma Client..."

# Generate Prisma client
npx prisma generate

echo "✅ Prisma client generated successfully!"
echo ""
echo "📊 Pushing schema changes to database..."

# Push schema to database
npx prisma db push

echo "✅ Database schema updated!"
echo ""
echo "🎉 All done! Please restart your development server."
