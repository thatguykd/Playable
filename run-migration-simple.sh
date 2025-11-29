#!/bin/bash

# Load environment variables
source .env.local 2>/dev/null || true

echo "🔧 Running migration via Supabase SQL..."
echo ""

# Read the migration file
MIGRATION_SQL=$(cat supabase/migrations/003_game_versions.sql)

# Try to create the table using psql if available, otherwise provide instructions
if command -v psql &> /dev/null; then
    echo "📝 Executing SQL via psql..."
    echo "$MIGRATION_SQL" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"
else
    echo "⚠️  psql not available. Please run migration manually."
    echo ""
    echo "📋 Manual Migration Instructions:"
    echo "=================================="
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Click 'SQL Editor' in the left sidebar"
    echo "4. Click 'New Query'"
    echo "5. Copy the entire contents of: supabase/migrations/003_game_versions.sql"
    echo "6. Paste into the editor and click 'Run'"
    echo ""
    echo "Or copy this SQL:"
    echo "=================================="
    cat supabase/migrations/003_game_versions.sql
fi
