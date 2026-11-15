# Domain 5 — Monitor and Maintain Azure Resources (10–15%)

50 questions · Answer key at the bottom — attempt first!
Subtopics: Azure Monitor (metrics, logs, alerts, Insights) · Network Watcher & Connection Monitor · Azure Backup & Site Recovery

---

## Section A — Azure Monitor: metrics, logs, alerts (Q1–Q20)

### Q1 [MCQ | Easy | Metrics]
Platform metrics in Azure Monitor are:
- A. Collected only after you install an agent
- B. Collected automatically for Azure resources at no extra setup, retained ~93 days
- C. Stored forever
- D. Available only with P2 licenses

### Q2 [MCQ | Medium | Metrics]
To keep VM CPU metrics for 2 years for trend analysis, you should:
- A. Nothing — metrics are kept forever
- B. Route metrics via diagnostic settings to a Log Analytics workspace (or storage) with appropriate retention
- C. Take screenshots monthly
- D. Enable boot diagnostics

### Q3 [MCQ | Easy | Logs]
Which query language is used to analyze data in Log Analytics?
- A. SQL
- B. KQL (Kusto Query Language)
- C. GraphQL
- D. XPath

### Q4 [MCQ | Medium | KQL]
Which KQL query returns the number of heartbeat records per computer in the last hour?
- A. `Heartbeat | where TimeGenerated > ago(1h) | summarize count() by Computer`
- B. `SELECT * FROM Heartbeat`
- C. `Heartbeat | order by Computer`
- D. `count Heartbeat GROUP Computer`

### Q5 [MCQ | Medium | Workspace]
Default interactive retention for most Log Analytics tables, and the configurable maximum:
- A. 7 days; 30 max
- B. 30 days; up to 730 days (2 years) interactive
- C. 1 year; 5 years
- D. Unlimited by default

### Q6 [MCQ | Medium | Diagnostic settings]
Which are valid destinations for a resource's diagnostic settings? (best single answer)
- A. Log Analytics workspace, storage account, event hub, partner solutions
- B. Only Log Analytics
- C. Email and SMS
- D. Another subscription's activity log

### Q7 [MCQ | Easy | Activity log]
The Activity log answers which question?
- A. CPU usage of a VM
- B. WHO performed WHAT management operation (control plane) on WHICH resource and WHEN
- C. Application exceptions
- D. Network latency

### Q8 [MCQ | Medium | Activity log]
Activity log events are retained in the portal for how long, and how do you keep them longer?
- A. 7 days; impossible to extend
- B. 90 days; send to a Log Analytics workspace / storage via diagnostic settings
- C. 1 year by default
- D. 30 days; upgrade subscription

### Q9 [MCQ | Easy | Alerts]
The three main components of an Azure Monitor alert setup are:
- A. Scope (target resource), condition (signal logic), and action group (+ alert details)
- B. User, password, email
- C. Metric, log, trace
- D. Budget, threshold, invoice

### Q10 [MCQ | Medium | Action groups]
Which notification/action types can an action group perform? (best single answer)
- A. Email/SMS/push/voice, plus actions like webhook, Azure Function, Logic App, runbook, ITSM
- B. Email only
- C. Portal popup only
- D. Teams messages only

### Q11 [MCQ | Medium | Alerts]
CPU > 90% for 5 minutes on 30 VMs must trigger ONE alert rule covering all of them, automatically including future VMs in the subscription. Use:
- A. 30 separate rules
- B. A metric alert rule scoped to the subscription/resource group with multiple resource targeting
- C. A budget
- D. Service Health alert

### Q12 [MCQ | Hard | Alerts]
During a planned maintenance window you must stop alert NOTIFICATIONS without editing/disabling dozens of alert rules. Use:
- A. Delete action groups
- B. An alert processing rule that suppresses notifications for the scope/time window
- C. Turn off Azure Monitor
- D. Remove role assignments

### Q13 [MCQ | Medium | Alerts]
Dynamic thresholds in metric alerts:
- A. Are set manually each week
- B. Use machine learning on the metric's history to learn normal patterns and alert on deviations
- C. Only work for CPU
- D. Are free text rules

### Q14 [MCQ | Easy | Alert states]
After an alert fires, the admin reviewing it should change its user state through which progression?
- A. New → Acknowledged → Closed
- B. Open → Done
- C. Red → Green
- D. Fired → Deleted

### Q15 [MCQ | Medium | Agents]
Which agent is the current (non-deprecated) way to collect guest OS logs/performance from VMs into Azure Monitor, and what pairs with it?
- A. Log Analytics (MMA) agent alone
- B. Azure Monitor Agent (AMA) with Data Collection Rules (DCRs)
- C. Telegraf only
- D. No agent needed for guest data

### Q16 [MCQ | Medium | VM insights]
VM insights provides:
- A. Billing data
- B. Performance charts and a dependency map of processes/connections for monitored VMs
- C. RBAC reports
- D. Patching

### Q17 [MCQ | Hard | KQL]
Query: `Perf | where ObjectName == "Processor" and CounterName == "% Processor Time" | summarize avg(CounterValue) by Computer, bin(TimeGenerated, 1h)`. What does bin() do?
- A. Deletes old rows
- B. Groups records into fixed 1-hour time buckets for aggregation
- C. Rounds CPU values
- D. Limits the output to one hour

### Q18 [MCQ | Medium | Insights]
Storage account latency/availability/capacity visualizations with no setup are available via:
- A. Storage insights (Azure Monitor Insights)
- B. Network Watcher
- C. Service Health
- D. Azure Advisor only

### Q19 [YESNO | Medium | Monitor]
Answer Yes or No:
1. A single alert rule can trigger multiple action groups.
2. Log query alerts can run on a schedule evaluating a KQL query.
3. Metrics are better suited than logs for near-real-time alerting.
4. Deleting a VM also deletes its past data in the Log Analytics workspace.

### Q20 [MCQ | Medium | Costs]
The biggest cost driver of a Log Analytics workspace is typically:
- A. Number of users
- B. Data INGESTION volume (GB/day) — controlled via DCRs, sampling, and retention settings
- C. Number of dashboards
- D. Alert rule count

---

## Section B — Network Watcher (Q21–Q28)

### Q21 [MCQ | Easy | NW]
Network Watcher is enabled:
- A. Per VM
- B. Per region (automatically when you create a VNet, in most cases)
- C. Per subscription globally with one click only
- D. Per NSG

### Q22 [MCQ | Medium | NW tools]
Match the tool to the question it answers: "Is traffic from 10.0.0.4:5000 to 8.8.8.8:443 allowed by NSGs?"
- A. Next hop
- B. IP flow verify
- C. Topology
- D. VPN troubleshoot

### Q23 [MCQ | Medium | NW tools]
"Which route does traffic from VM1 to 10.2.0.10 take — gateway, NVA, or internet?" is answered by:
- A. Next hop
- B. Connection troubleshoot
- C. NSG diagnostics
- D. Packet capture

### Q24 [MCQ | Medium | NW tools]
You must capture actual packets to/from a VM for deep protocol analysis in Wireshark. Use:
- A. Activity log
- B. Network Watcher packet capture (stores .cap to storage/file)
- C. IP flow verify
- D. Effective routes

### Q25 [MCQ | Medium | Connection Monitor]
Connection Monitor is used to:
- A. Monitor billing connections
- B. Continuously test connectivity/latency between sources (VMs/on-prem agents) and destinations (VMs, FQDNs, IPs) over time
- C. Replace NSGs
- D. Capture packets

### Q26 [MCQ | Hard | Flow logs]
NSG flow logs are stored in ______ and visualized with ______:
- A. Log Analytics; Azure Advisor
- B. A storage account; Traffic Analytics (which needs a Log Analytics workspace)
- C. Event Hub; Power BI only
- D. The NSG itself; portal charts

### Q27 [MCQ | Medium | Troubleshooting]
A site-to-site VPN tunnel is down. Which Network Watcher capability produces a diagnostic report of the gateway and connection?
- A. VPN troubleshoot
- B. IP flow verify
- C. Topology
- D. Security group view

### Q28 [YESNO | Medium | NW]
Answer Yes or No:
1. Connection troubleshoot can test from a VM to an arbitrary FQDN at a point in time.
2. Packet capture can be triggered automatically by an alert.
3. Topology view shows resources and their network relationships in a resource group/VNet.
4. Network Watcher tools work on VMs without any extension installed.

---

## Section C — Backup and Site Recovery (Q29–Q50)

### Q29 [MCQ | Easy | Vaults]
Which workloads does a RECOVERY SERVICES vault protect (vs a Backup vault)?
- A. Azure VMs, SQL/SAP in VMs, Azure Files, on-prem via MARS/MABS
- B. Azure Blobs, Azure Disks, Azure Database for PostgreSQL
- C. Only VMs
- D. Only on-premises servers

### Q30 [MCQ | Medium | Vaults]
Azure Blobs, Azure Disks, and Azure Database for PostgreSQL backups go into:
- A. Recovery Services vault
- B. Backup vault
- C. Storage account
- D. Key Vault

### Q31 [MCQ | Medium | Vaults]
A Recovery Services vault protecting VMs in West Europe must itself be:
- A. In any region
- B. In the SAME region as the VMs it protects
- C. In the paired region
- D. Global

### Q32 [MCQ | Hard | Vaults]
Vault storage redundancy (LRS/ZRS/GRS) for backups can be changed:
- A. Anytime
- B. Only BEFORE the first backup item is protected in the vault
- C. Once per year
- D. Never — it's always GRS

### Q33 [MCQ | Easy | VM backup]
A standard Azure VM backup policy supports backups how often?
- A. Every 5 minutes
- B. Once per day (Standard policy); Enhanced policy allows multiple per day
- C. Hourly in Standard
- D. Weekly minimum

### Q34 [MCQ | Medium | VM backup]
"Instant restore" snapshots in Azure VM backup are kept locally for a configurable:
- A. 1–5 days (default 2) — enabling fast restores without transferring from the vault
- B. 30 days
- C. 1 year
- D. 12 hours

### Q35 [MCQ | Medium | Soft delete backup]
Soft delete for Azure Backup means deleted backup data is retained for:
- A. 14 additional days at no cost, allowing recovery of the backup data
- B. 90 days with charges
- C. 24 hours
- D. It prevents deleting the VM itself

### Q36 [MCQ | Medium | Restore]
A user deleted one file inside a backed-up Azure VM. The fastest recovery is:
- A. Restore the whole VM
- B. File-level recovery: mount the recovery point as a local drive via the provided script and copy the file
- C. Rebuild the VM from template
- D. Azure Site Recovery failover

### Q37 [MCQ | Medium | Restore]
Restore options for an Azure VM backup include: (best single answer)
- A. Create new VM, restore disks only, replace existing disks, cross-region restore (if enabled)
- B. Only in-place overwrite
- C. Only file recovery
- D. Export to on-premises only

### Q38 [MCQ | Hard | MARS]
The MARS (Microsoft Azure Recovery Services) agent:
- A. Backs up entire Hyper-V hosts
- B. Backs up files/folders/system state from on-premises Windows machines directly to Azure, up to 3 times a day
- C. Runs on Linux
- D. Backs up Azure SQL databases

### Q39 [MCQ | Medium | Backup center]
To manage/monitor backups across many vaults and subscriptions from one place, use:
- A. Each vault separately
- B. Backup center
- C. Azure Advisor
- D. Cost Management

### Q40 [MCQ | Hard | Vault deletion]
You try to delete a Recovery Services vault and it fails. The required steps are:
- A. Open a ticket
- B. Stop backup for all protected items (optionally delete data), unregister servers/infrastructure, then delete
- C. Wait 30 days
- D. Delete the resource group instead — it bypasses checks

### Q41 [MCQ | Easy | ASR]
Azure Site Recovery's primary purpose vs Azure Backup:
- A. Identical products
- B. ASR = disaster recovery (replicate & fail over whole workloads, low RTO); Backup = point-in-time data restore
- C. ASR only backs up files
- D. Backup is for regions; ASR for files

### Q42 [MCQ | Medium | ASR]
Azure-to-Azure VM replication with ASR replicates VMs:
- A. Only within one region
- B. To another target region (typically cross-region DR) continuously
- C. Weekly
- D. To on-premises only

### Q43 [MCQ | Medium | ASR]
A TEST failover in ASR:
- A. Causes downtime in production
- B. Brings up replica VMs in an isolated network with no impact on production or ongoing replication
- C. Deletes replication
- D. Is not supported

### Q44 [MCQ | Hard | ASR]
Order-sensitive multi-tier app (DB first, then app, then web) must fail over correctly. Use:
- A. Manual notes
- B. A recovery plan grouping machines with ordered groups (and optional scripts/runbooks)
- C. Alphabetical failover
- D. Separate vaults per tier

### Q45 [MCQ | Medium | ASR]
RPO vs RTO:
- A. RPO = max acceptable data loss (time between recovery points); RTO = max acceptable downtime to be running again
- B. Reversed
- C. Both mean backup frequency
- D. Marketing terms

### Q46 [MCQ | Medium | Azure Files backup]
Azure Backup protects Azure file shares using:
- A. Full-copy backups into the vault only
- B. Share snapshots managed by the backup policy (stored in the storage account, orchestrated via the vault)
- C. MARS agent on a VM
- D. AzCopy scripts

### Q47 [MCQ | Hard | Cross-region restore]
Cross-region restore (CRR) for VM backups lets you:
- A. Restore only after Microsoft declares a disaster
- B. Restore VMs in the secondary (paired) region yourself at any time — requires the vault to use GRS WITH cross-region restore enabled
- C. Restore to any region worldwide
- D. Works with LRS vaults

### Q48 [MCQ | Medium | Policies]
A backup policy for VMs defines: (best single answer)
- A. Schedule (frequency/time) and retention (daily/weekly/monthly/yearly points)
- B. The VM size
- C. NSG rules
- D. Encryption keys only

### Q49 [YESNO | Hard | Backup/ASR]
Answer Yes or No:
1. You can back up a VM in region A to a vault in region B (direct, without CRR).
2. Stopping backup with "retain data" keeps existing recovery points usable.
3. ASR can migrate VMs between regions (as well as for DR).
4. A VM can be protected by Azure Backup and replicated by ASR at the same time.

### Q50 [SCENARIO | Hard | Backup mixed]
Contoso runs 20 production VMs in North Europe. Requirements: daily backups kept 30 days + monthly kept 12 months; a quarterly DR drill with ZERO production impact; ability to run workloads in West Europe within 1 hour of a regional disaster; one admin accidentally deleted a backup — data must still be recoverable for 2 weeks.
1. What implements the backup schedule/retention?
2. What provides the DR drill with no production impact?
3. Which service and configuration meet the 1-hour RTO regional DR?
4. Which feature covers the accidental backup deletion?

---
---

# 🔑 Answer Key — Domain 5

**Q1 — B.** Platform metrics: automatic, ~93-day retention. 📎 [Metrics overview](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/data-platform-metrics)

**Q2 — B.** Long-term = route to Log Analytics/storage via diagnostic settings. 📎 same.

**Q3 — B.** KQL. 📎 [Log queries](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-query-overview)

**Q4 — A.** where + ago() + summarize count() by. 📎 [KQL tutorial](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/get-started-queries)

**Q5 — B.** Default 30 days (31 for some tables); interactive retention configurable to 730 days; archive extends further. 📎 [Data retention](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/data-retention-configure)

**Q6 — A.** LA workspace, storage, event hub, partner integrations. 📎 [Diagnostic settings](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/diagnostic-settings)

**Q7 — B.** Activity log = control-plane audit (who/what/when). 📎 [Activity log](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/activity-log)

**Q8 — B.** 90 days in-platform; export for longer retention/analysis. 📎 same.

**Q9 — A.** Scope + condition + actions (action group) + details. 📎 [Alerts overview](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)

**Q10 — A.** Notifications (email/SMS/voice/push) + actions (webhook, Function, Logic App, runbook, ITSM, Event Hub). 📎 [Action groups](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/action-groups)

**Q11 — B.** Multi-resource metric alerts scope a whole subscription/RG for same-type resources, auto-covering new ones. 📎 [Metric alerts](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-metric-overview)

**Q12 — B.** Alert processing rules suppress notifications by scope/schedule without touching the rules. 📎 [Alert processing rules](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules)

**Q13 — B.** ML-based dynamic thresholds learn seasonality/patterns. 📎 [Dynamic thresholds](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-dynamic-thresholds)

**Q14 — A.** New → Acknowledged → Closed. 📎 [Alerts overview](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)

**Q15 — B.** AMA + Data Collection Rules replaced the legacy Log Analytics agent (retired Aug 2024). 📎 [Azure Monitor Agent](https://learn.microsoft.com/en-us/azure/azure-monitor/agents/agents-overview)

**Q16 — B.** Performance + Map (dependencies via processes/connections). 📎 [VM insights](https://learn.microsoft.com/en-us/azure/azure-monitor/vm/vminsights-overview)

**Q17 — B.** bin() buckets timestamps into fixed intervals for time-series aggregation. 📎 [KQL tutorial](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/get-started-queries)

**Q18 — A.** Storage insights = ready-made monitoring views for storage accounts. 📎 [Storage insights](https://learn.microsoft.com/en-us/azure/storage/common/storage-insights-overview)

**Q19 — 1 Yes. 2 Yes. 3 Yes** (metrics are near-real-time; log alerts have ingestion+evaluation lag). **4 No** (ingested data stays for its retention period). 📎 [Alerts overview](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)

**Q20 — B.** Pay-per-GB ingestion dominates; control with DCRs/filtering/commitment tiers. 📎 [LA pricing](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/cost-logs)

**Q21 — B.** One Network Watcher instance per region (auto-enabled with VNets by default). 📎 [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-monitoring-overview)

**Q22 — B.** NSG allow/deny for a specific flow = IP flow verify. 📎 [IP flow verify](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-ip-flow-verify-overview)

**Q23 — A.** Routing decision = Next hop. 📎 [Next hop](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-next-hop-overview)

**Q24 — B.** Packet capture produces .cap files for Wireshark. 📎 [Packet capture](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-packet-capture-overview)

**Q25 — B.** Continuous connectivity/latency monitoring over time. 📎 [Connection Monitor](https://learn.microsoft.com/en-us/azure/network-watcher/connection-monitor-overview)

**Q26 — B.** Flow logs → storage account; Traffic Analytics (needs LA workspace) visualizes. 📎 [NSG flow logs](https://learn.microsoft.com/en-us/azure/network-watcher/nsg-flow-logs-overview)

**Q27 — A.** VPN troubleshoot generates gateway/connection diagnostics. 📎 [VPN troubleshoot](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-troubleshoot-overview)

**Q28 — 1 Yes. 2 Yes** (alert-triggered captures via functions/automation; built-in VM alert trigger exists). **3 Yes. 4 No** (several tools need the Network Watcher VM extension, e.g. packet capture, connection troubleshoot). 📎 [Network Watcher](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-monitoring-overview)

**Q29 — A.** RSV: Azure VMs, workloads in VMs (SQL/SAP), Azure Files, MARS/MABS/DPM. 📎 [Recovery Services vault](https://learn.microsoft.com/en-us/azure/backup/backup-azure-recovery-services-vault-overview)

**Q30 — B.** Backup vault: Blobs, Disks, PostgreSQL (newer workloads). 📎 [Backup vault](https://learn.microsoft.com/en-us/azure/backup/backup-vault-overview)

**Q31 — B.** Vault and protected VMs must share a region. 📎 [Backup FAQ](https://learn.microsoft.com/en-us/azure/backup/backup-azure-backup-faq)

**Q32 — B.** Change redundancy before protecting the first item; locked afterwards. 📎 same.

**Q33 — B.** Standard: once daily; Enhanced: multiple per day (also needed for Trusted Launch VMs originally). 📎 [VM backup policy](https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-introduction)

**Q34 — A.** Instant restore snapshot tier: 1–5 days, default 2. 📎 [Instant restore](https://learn.microsoft.com/en-us/azure/backup/backup-instant-restore-capability)

**Q35 — A.** 14 days free retention of deleted backup data. 📎 [Backup soft delete](https://learn.microsoft.com/en-us/azure/backup/backup-azure-security-feature-cloud)

**Q36 — B.** File recovery mounts the recovery point via script (iSCSI) — copy just the file. 📎 [File recovery](https://learn.microsoft.com/en-us/azure/backup/backup-azure-restore-files-from-vm)

**Q37 — A.** New VM / restore disks / replace existing / cross-region (when enabled). 📎 [Restore VMs](https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-restore-vms)

**Q38 — B.** MARS: Windows files/folders/system state, direct to Azure, max 3/day. Not Linux, not host-level. 📎 [MARS agent](https://learn.microsoft.com/en-us/azure/backup/backup-azure-about-mars)

**Q39 — B.** Backup center = single pane across vaults/subscriptions. 📎 [Backup center](https://learn.microsoft.com/en-us/azure/backup/backup-center-overview)

**Q40 — B.** Vaults with protected items can't be deleted: stop protection, unregister, then delete. D ✗ RG delete fails too. 📎 [Delete vault](https://learn.microsoft.com/en-us/azure/backup/backup-azure-delete-vault)

**Q41 — B.** ASR = DR/replication/failover; Backup = data restore points. 📎 [ASR overview](https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview)

**Q42 — B.** Continuous replication to a target region for DR. 📎 [Azure-to-Azure DR](https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-quickstart)

**Q43 — B.** Test failover = isolated network, zero production impact — this is how DR drills are done. 📎 [Test failover](https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-dr-drill)

**Q44 — B.** Recovery plans: ordered groups + automation scripts. 📎 [Recovery plans](https://learn.microsoft.com/en-us/azure/site-recovery/recovery-plan-overview)

**Q45 — A.** RPO = data loss tolerance; RTO = downtime tolerance. 📎 [ASR overview](https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview)

**Q46 — B.** Azure Files backup = policy-managed share snapshots. 📎 [Back up Azure Files](https://learn.microsoft.com/en-us/azure/backup/azure-file-share-backup-overview)

**Q47 — B.** CRR: customer-initiated restores in the paired region anytime; needs GRS vault + CRR enabled. 📎 [Cross-region restore](https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-restore-vms#cross-region-restore)

**Q48 — A.** Policy = schedule + retention tiers. 📎 [VM backup](https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-introduction)

**Q49 — 1 No** (vault must be in the VM's region; CRR is about restore, not backup location). **2 Yes. 3 Yes** (ASR also does region migration). **4 Yes** (Backup + ASR together is recommended practice). 📎 [Backup FAQ](https://learn.microsoft.com/en-us/azure/backup/backup-azure-backup-faq)

**Q50 — 1:** Recovery Services vault + backup policy: daily backups retained 30 days, monthly retention 12 months. **2:** ASR test failover into an isolated VNet. **3:** Azure Site Recovery replicating the VMs North Europe → West Europe with a recovery plan (RTO within minutes–1 hour). **4:** Backup soft delete (14-day retention of deleted backup data). 📎 [Backup policy](https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-introduction) · [Test failover](https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-dr-drill) · [Soft delete](https://learn.microsoft.com/en-us/azure/backup/backup-azure-security-feature-cloud)
