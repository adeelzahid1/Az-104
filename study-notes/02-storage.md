# Study Notes — Domain 2: Implement and Manage Storage (15–20%)

Exam-focused cheat sheet. Pair with `question-bank/02-storage.md`.

---

## 1. Storage accounts

| Account kind | Performance | Holds | Notes |
|---|---|---|---|
| **General-purpose v2 (GPv2)** | Standard | blobs, files, queues, tables | the default answer; all tiers & redundancy |
| **BlockBlobStorage** | Premium | block/append blobs | low latency, high TPS |
| **FileStorage** | Premium | file shares (SMB/NFS) | low latency shares |
| Page blob / GPv1 / BlobStorage | legacy | — | upgrade to GPv2 |

- Name: **3–24 chars, lowercase+digits, globally unique**.
- Region: pick where consumers are; moving an account between regions = copy, not move.

## 2. Redundancy (memorize the ladder)

| SKU | Copies | Survives | Read secondary? |
|---|---|---|---|
| **LRS** | 3, one datacenter | drive/rack failure | — |
| **ZRS** | 3 across AZs | zone outage | — |
| **GRS** | LRS + 3 in paired region | region outage | No |
| **RA-GRS** | GRS | region outage | **Yes** (`-secondary` endpoint) |
| **GZRS** | ZRS + geo | zone + region | No |
| **RA-GZRS** | GZRS | zone + region | **Yes** |

- Premium accounts: **LRS (and ZRS in some regions) only** — no geo.
- **Customer-initiated failover** (GRS/GZRS): account becomes **LRS** in the new primary; re-enable geo afterwards. Possible data loss (async replication).
- Conversion LRS↔GRS etc. possible in place; ZRS conversions may take a migration process.

## 3. Access control

### Keys & SAS
- **2 access keys** → rotate without downtime; key rotation kills every SAS signed with that key.
- **SAS types:** Account SAS (account-wide) · Service SAS (one service/object) · **User delegation SAS** (signed by Entra ID; Blob, Queue, Table and Files — most secure).
- SAS limits: expiry, permissions, **IP range**, **HTTPS-only**.
- **Ad-hoc SAS can't be revoked individually** — only by rotating the key. → Create SAS from a **stored access policy** (max **5 per container**): edit/delete policy = instant revoke for all tokens tied to it.

### Entra ID (data plane)
- Roles: **Storage Blob Data Reader / Contributor / Owner** (and Queue equivalents). Control-plane Reader/Contributor ≠ data access.
- Portal "auth mode": Access key vs Entra account.

### Azure Files identity auth (SMB)
- Sources: **on-prem AD DS**, **Entra Domain Services**, **Entra Kerberos** (hybrid).
- Two layers required: **share-level RBAC** (Storage File Data SMB Share Reader/Contributor/Elevated Contributor) **+ NTFS ACLs**.

### Network security
- Firewall: default allow → "Enabled from selected networks": add **VNet rules** (need **Microsoft.Storage service endpoint** on the subnet) + **public IP rules** (for office IPs).
- **"Allow trusted Microsoft services"** exception for Backup, Monitor, etc.
- **Private endpoint** = private IP in your VNet per sub-service (blob/file/...) + `privatelink.*` DNS zone. Works from on-prem over VPN.
- Anonymous blob access levels: Private / **Blob** (read blobs, no listing) / **Container** (read + list).

## 4. Blob storage

- Blob types: **Block** (objects/files) · **Append** (logs) · **Page** (VHD/disks).
- **Access tiers:** Hot · Cool (30-day min) · Cold (90-day min) · **Archive** (offline!, 180-day min, blob-level only).
  - Account default tier: hot, cool, cold, or **Smart** (archive is never the default).
  - **Smart tier:** GPv2 + zone redundancy (ZRS/GZRS/RA-GZRS); hot → cool at 30 days → cold at 90 days without access; any access returns to hot; no archive; objects < 128 KiB stay hot.
  - Archive rehydration: Standard **up to 15 h**; High priority <1 h (<10 GB). Or "copy out" to a new blob.
- **Lifecycle management:** rules on last-modified/created/accessed → tierToCool/tierToCold/tierToArchive/delete; applies to base blobs/snapshots/versions. First run can take **24–48 h**.
- **Versioning** (automatic on every write/delete) vs **snapshots** (manual). Versioning is the modern answer.
- **Soft delete** (blobs & containers): undelete within retention (1–365 days).
- **Object replication:** async block-blob copy account→account (cross region/sub). Requires **versioning on both + change feed on source**.
- Immutable storage: time-based retention / legal hold (WORM) for compliance.

## 5. Azure Files

- SMB port **445** — often ISP-blocked → VPN/ExpressRoute (+ private endpoint) or Azure File Sync.
- **NFS 4.1**: premium FileStorage only, Linux.
- Pay-as-you-go (HDD) and provisioned v1 SSD shares: up to 100 TiB; provisioned v2: up to 256 TiB.
- **Share snapshots**: read-only, incremental; Azure Backup for files = policy-driven snapshots.
- **Azure File Sync:** Storage Sync Service → **sync group** → **1 cloud endpoint** (Azure share) + N **server endpoints** (Windows Server paths). **Cloud tiering** = hot files cached locally, cold files = stubs recalled on demand. Agent: Windows Server 2012 R2+.

## 6. Encryption

- **SSE**: always on, can't disable, Microsoft-managed keys by default.
- **Customer-managed keys (CMK):** Key Vault + key; vault needs **soft delete + purge protection**; account uses a managed identity to reach the vault.
- **Infrastructure (double) encryption:** creation-time only.

## 7. Tools & migration

- **AzCopy:** `azcopy copy` (one-way copy), `azcopy sync` (differential sync), auth = `azcopy login` (Entra) or SAS. 
- **Storage Explorer:** free desktop GUI (uses AzCopy under the hood).
- Big data, low bandwidth → **Azure Data Box / Import-Export** (ship drives).

---

## ⚡ Rapid-fire traps
1. Archive = offline; reading requires rehydration (hours).
2. Ad-hoc SAS revocation = regenerate key (use stored access policies instead).
3. RA- prefix = read access to secondary; plain GRS secondary is unreadable until failover.
4. Premium = LRS/ZRS only; no tiers on premium block blob (hot/cool/archive are standard GPv2 features).
5. Service endpoint ≠ private IP. Private endpoint = private IP + privatelink DNS.
6. Reader role ≠ blob data access.
7. Azure Files AD auth = RBAC share level + NTFS both.
8. Object replication prerequisites: versioning ×2 + change feed.
9. Early deletion: cool 30 / cold 90 / archive 180 days.
10. Port 445 blocked → can't mount SMB from home/ISP.

📎 [Storage account overview](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-overview) · [Redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy) · [SAS](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) · [Access tiers](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview) · [File Sync](https://learn.microsoft.com/en-us/azure/storage/file-sync/file-sync-introduction) · [AzCopy](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10)
