# Study Notes — Domain 5: Monitor and Maintain Azure Resources (10–15%)

Exam-focused cheat sheet. Pair with `question-bank/05-monitoring-backup.md`.

---

## 1. Azure Monitor data

| Data | What | Retention | Notes |
|---|---|---|---|
| **Platform metrics** | numeric time-series, auto-collected | ~93 days | near-real-time; pin to dashboards |
| **Activity log** | control-plane audit (who/what/when) | 90 days | export via diagnostic settings for longer |
| **Resource logs** | data-plane logs | n/a until routed | require **diagnostic settings** |
| **Guest OS data** | perf counters, event logs inside VMs | per workspace | needs **Azure Monitor Agent + DCR** |

- **Diagnostic settings destinations:** Log Analytics workspace · storage account · event hub · partner. One setting per destination combo; configure per resource.
- **Azure Monitor Agent (AMA)** + **Data Collection Rules (DCRs)** replaced the legacy Log Analytics/MMA agent (retired 2024).
- Log Analytics retention: default **30 days**, interactive up to **730 days** (archive beyond). Cost driver = **ingestion GB**.

## 2. KQL essentials

```kusto
Heartbeat
| where TimeGenerated > ago(1h)
| summarize count() by Computer

Perf
| where ObjectName == "Processor" and CounterName == "% Processor Time"
| summarize avg(CounterValue) by Computer, bin(TimeGenerated, 1h)
```
- `where` filter → `summarize` aggregate (`by` grouping) → `bin()` time buckets → `project` columns → `top N by` / `order by`.
- Common tables: Heartbeat, Perf, Event (Windows), Syslog (Linux), AzureActivity, InsightsMetrics.

## 3. Alerts

- Rule = **scope + condition (signal) + action group + details (severity 0–4)**.
- Signals: **metric** (near-real-time, supports **dynamic thresholds** — ML-learned normal), **log** (scheduled KQL), **activity log** (e.g., "VM deleted", Service Health).
- **Multi-resource metric alerts**: one rule covering all same-type resources in a sub/RG, auto-includes new ones.
- **Action groups:** notifications (email/SMS/voice/push) + actions (webhook, Azure Function, Logic App, Automation runbook, ITSM, Event Hub). Reusable; one rule can call several.
- **Alert processing rules:** suppress notifications (maintenance windows) or attach action groups at scale — without touching rules.
- Alert user states: **New → Acknowledged → Closed**.
- **Autoscale** (Monitor feature): metric/schedule-based scale out/in for VMSS/App Service; always respects min/max; cooldown.

## 4. Insights

- **VM insights:** Performance + **Map** (process/connection dependencies).
- Storage insights / Network insights / Container insights: curated monitoring views, no setup beyond onboarding.

## 5. Network Watcher (regional service)

| Tool | Question it answers |
|---|---|
| **IP flow verify** | is this 5-tuple allowed, which NSG rule decides? |
| **Next hop** | where does traffic from this VM to X actually go? |
| **Effective security rules** | merged subnet+NIC NSG rules on a NIC |
| **Connection troubleshoot** | can VM reach endpoint right now (point-in-time)? |
| **Connection Monitor** | continuous connectivity/latency over time |
| **Packet capture** | record .cap for Wireshark (needs NW VM extension) |
| **VPN troubleshoot** | gateway/connection diagnostic report |
| **Topology** | visual map of network resources |
| **NSG flow logs** | traffic records → storage account; visualize with **Traffic Analytics** (needs Log Analytics) |

## 6. Azure Backup

### Vaults
- **Recovery Services vault:** Azure VMs, SQL/SAP HANA in VMs, **Azure Files**, on-prem (MARS/MABS/DPM). Must be **same region as protected VMs**.
- **Backup vault:** newer workloads — **Blobs, Managed Disks, PostgreSQL**.
- Vault **storage redundancy (LRS/ZRS/GRS)**: set **before first protected item**, locked after.
- **Cross-Region Restore (CRR):** GRS vault + CRR enabled → restore in paired region anytime, customer-initiated.
- Vault deletion: must stop protection + unregister everything first; RG delete doesn't bypass.

### VM backup
- Policy: **Standard** = once/day (+ retention daily/weekly/monthly/yearly); **Enhanced** = multiple/day, zone-resilient.
- **Instant restore:** local snapshots kept **1–5 days (default 2)** for fast restores.
- **Soft delete:** deleted backup data kept **14 days free**.
- Restore options: create new VM · restore disks · **replace existing disks** · **file-level recovery** (mount recovery point via script) · cross-region (if CRR).
- First backup = full; subsequent = incremental.

### Agents
- **MARS:** on-prem **Windows** files/folders/system state direct to vault; up to **3/day**; no Linux, no app-awareness.
- **MABS/DPM:** app-aware on-prem backups (SQL, Exchange, Hyper-V/VMware) → vault.
- **Backup center:** single pane across vaults/subscriptions.

## 7. Azure Site Recovery (ASR)

- **DR orchestration**: continuous replication of VMs to another region (or on-prem→Azure); fail over when disaster strikes; fail back after.
- **Backup = data points-in-time; ASR = running workloads with low RTO.** They complement each other.
- **RPO** = max data loss (replication freshness) · **RTO** = max downtime.
- **Test failover:** isolated network, zero production impact — the answer to every "DR drill" question.
- **Recovery plan:** ordered groups (DB → app → web) + scripts/runbooks for multi-tier apps.
- Also used for **region migration** of VMs.

---

## ⚡ Rapid-fire traps
1. Metrics ~93 days; Activity log 90 days; LA default 30 → route to workspace for longer.
2. Resource logs flow NOWHERE until a diagnostic setting exists.
3. Maintenance window silencing = alert processing rule, not deleting rules.
4. Budgets/alerts never stop resources; autoscale never exceeds max.
5. VM + vault must share a region; vault redundancy locks at first backup.
6. RSV vs Backup vault workload split (Blobs/Disks/PostgreSQL → Backup vault).
7. Soft delete backup = 14 days; blob soft delete = configurable 1–365.
8. One deleted file in a VM → file-level recovery, never full VM restore.
9. DR drill = ASR test failover (isolated VNet).
10. MARS = Windows files/folders only, 3×/day max.

📎 [Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/overview) · [KQL](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/get-started-queries) · [Alerts](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview) · [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-monitoring-overview) · [Azure Backup](https://learn.microsoft.com/en-us/azure/backup/backup-overview) · [Site Recovery](https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview)
