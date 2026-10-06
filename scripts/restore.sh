#!/usr/bin/env bash
# ==============================================================================
# Momentra (HDAM) — Disaster Recovery & Database Restoration Script
# Recovery Time Objective (RTO) Target: <= 30 minutes
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.dump>"
    echo "Example: $0 /opt/momentra/backups/momentra_db_20261005_120000.dump"
    exit 1
fi

RESTORE_FILE="$1"
CHECKSUM_FILE="${RESTORE_FILE}.sha256"

if [ ! -f "${RESTORE_FILE}" ]; then
    echo "Error: Backup file ${RESTORE_FILE} does not exist!"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Disaster Recovery Restore..."

# 1. Verify SHA-256 Checksum Integrity if checksum file is present
if [ -f "${CHECKSUM_FILE}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verifying SHA-256 Checksum..."
    EXPECTED_HASH=$(cat "${CHECKSUM_FILE}")
    ACTUAL_HASH=$(sha256sum "${RESTORE_FILE}" | awk '{print $1}')
    if [ "${EXPECTED_HASH}" != "${ACTUAL_HASH}" ]; then
        echo "FATAL: Checksum mismatch! Backup file is corrupted or tampered!"
        echo "Expected: ${EXPECTED_HASH}"
        echo "Actual:   ${ACTUAL_HASH}"
        exit 1
    fi
    echo "Checksum verification PASSED."
fi

# 2. Terminate existing connections to database
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Terminating active database connections..."
psql "${DATABASE_URL}" -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database() AND pid <> pg_backend_pid();
" || true

# 3. Execute pg_restore
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring database schema and records..."
pg_restore \
    --dbname="${DATABASE_URL}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --verbose \
    "${RESTORE_FILE}" || true

# 4. Verify Restoration Health
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verifying restoration integrity..."
ITEM_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM items;")
USER_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM users;")

echo "Restoration Success Summary:"
echo " - Total Users: $(echo "${USER_COUNT}" | tr -d ' ')"
echo " - Total Historical Items: $(echo "${ITEM_COUNT}" | tr -d ' ')"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Disaster Recovery Restore Completed Successfully."
