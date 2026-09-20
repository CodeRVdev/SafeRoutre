#!/usr/bin/env bash
# =================================================================
# SafeRoute — Automated PostgreSQL Database Backup Script
# Target: Hostinger KVM 2 (Ubuntu 22.04 / 24.04 LTS)
# =================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/saferoute}"
DB_NAME="${DB_NAME:-saferoute_db}"
DB_USER="${DB_USER:-saferoute_app}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "=================================================="
echo "📦 Starting SafeRoute Database Backup: $(date)"
echo "Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "Destination: ${BACKUP_FILE}"
echo "=================================================="

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# Execute pg_dump using PGPASSWORD environment variable (avoids exposing password in ps output)
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "File: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "❌ ERROR: Database backup failed!" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Verify backup file is non-empty
if [ ! -s "${BACKUP_FILE}" ]; then
    echo "❌ ERROR: Backup file is empty!" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Rotate backups older than RETENTION_DAYS
echo "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
echo "✨ Backup routine finished successfully."
