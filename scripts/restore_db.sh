#!/usr/bin/env bash
# =================================================================
# SafeRoute — Safe PostgreSQL Database Restore Script
# Target: Hostinger KVM 2 (Ubuntu 22.04 / 24.04 LTS)
# =================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    echo "Example: $0 /var/backups/saferoute/saferoute_db_20260920_080000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-saferoute_db}"
DB_USER="${DB_USER:-saferoute_app}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ ERROR: Backup file not found: ${BACKUP_FILE}" >&2
    exit 1
fi

if [ ! -r "${BACKUP_FILE}" ]; then
    echo "❌ ERROR: Backup file is not readable: ${BACKUP_FILE}" >&2
    exit 1
fi

echo "=================================================="
echo "⚠️  CRITICAL: DATABASE RESTORE OPERATION"
echo "Target Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "Source Backup:   ${BACKUP_FILE}"
echo "=================================================="
echo "This operation will OVERWRITE data in '${DB_NAME}'."
read -r -p "Are you sure you want to proceed? Type 'RESTORE_CONFIRM' to continue: " CONFIRMATION

if [ "${CONFIRMATION}" != "RESTORE_CONFIRM" ]; then
    echo "❌ Restore cancelled by user. No changes were made."
    exit 0
fi

# Create a pre-restore safety snapshot before restoring
SAFETY_SNAPSHOT="/tmp/pre_restore_safety_${DB_NAME}_$(date +%s).sql.gz"
echo "📸 Creating temporary pre-restore safety snapshot at ${SAFETY_SNAPSHOT}..."
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${SAFETY_SNAPSHOT}"; then
    echo "✅ Safety snapshot created."
else
    echo "⚠️ Warning: Failed to create safety snapshot. Proceeding with caution..."
fi

echo "🔄 Restoring database..."
if gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1; then
    echo "✅ Database restore completed successfully!"
    echo "Target '${DB_NAME}' is now synchronized with '${BACKUP_FILE}'."
else
    echo "❌ ERROR: Database restore encountered an error!" >&2
    echo "Your safety snapshot is available at: ${SAFETY_SNAPSHOT}"
    exit 1
fi
