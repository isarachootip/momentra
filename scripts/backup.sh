#!/usr/bin/env bash
# ==============================================================================
# Momentra (HDAM) — Automated PostgreSQL Backup & Off-site S3 Sync Script
# Recovery Point Objective (RPO) Target: <= 15 minutes
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/momentra/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="momentra_db_${TIMESTAMP}.dump"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
CHECKSUM_PATH="${BACKUP_PATH}.sha256"

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated database backup..."

# 1. Execute pg_dump with custom compressed archive format
pg_dump "${DATABASE_URL}" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --file="${BACKUP_PATH}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database dump created: ${BACKUP_PATH}"

# 2. Compute SHA-256 checksum for archival integrity
sha256sum "${BACKUP_PATH}" | awk '{print $1}' > "${CHECKSUM_PATH}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SHA-256 Checksum: $(cat "${CHECKSUM_PATH}")"

# 3. Off-site Sync to S3 / Cloudflare R2 Cold Storage (if AWS_CLI / S3 configured)
if command -v aws >/dev/null 2>&1 && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Syncing backup to remote S3 bucket: ${BACKUP_S3_BUCKET}..."
    aws s3 cp "${BACKUP_PATH}" "s3://${BACKUP_S3_BUCKET}/database/${BACKUP_FILENAME}"
    aws s3 cp "${CHECKSUM_PATH}" "s3://${BACKUP_S3_BUCKET}/database/${BACKUP_FILENAME}.sha256"
fi

# 4. Enforce 30-Day Retention Policy (Purge local backups older than 30 days)
find "${BACKUP_DIR}" -type f -name "momentra_db_*.dump*" -mtime +30 -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup complete and retention cleaned up successfully."
