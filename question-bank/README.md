# AZ-104 Question Bank

Original practice questions based on the official Microsoft AZ-104 study guide
(skills measured as of **October 26, 2023** — [official study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104)).

> This folder is the original snapshot and is not updated. The app's bank in `src/app/data/`
> follows the outline of April 17, 2026, with corrected facts.

Pass mark: **700 / 1000** · Typical exam: ~40–60 questions in ~100 minutes.

| File | Domain | Exam weight | Questions |
|------|--------|-------------|-----------|
| [01-identities-governance.md](01-identities-governance.md) | Manage Azure identities and governance | 20–25% | 50 |
| [02-storage.md](02-storage.md) | Implement and manage storage | 15–20% | 50 |
| [03-compute.md](03-compute.md) | Deploy and manage Azure compute resources | 20–25% | 50 |
| [04-networking.md](04-networking.md) | Implement and manage virtual networking | 15–20% | 50 |
| [05-monitoring-backup.md](05-monitoring-backup.md) | Monitor and maintain Azure resources | 10–15% | 50 |

## Full 1,000-question bank (app data)

The complete bank — **200 questions per domain, 1,000 total** — lives as JSON in
[`src/app/data/`](../src/app/data/), which is what the quiz app uses. The 250 questions in this
folder are the `*-core.json` sets; the `*-ext1/2/3.json` files add 750 more.

| Domain | Files | Questions |
|---|---|---|
| 1 Identities & governance | `d1-core`, `d1-ext1` (Entra users/groups/licensing/SSPR/devices), `d1-ext2` (RBAC, custom roles, managed identities), `d1-ext3` (Policy, locks, tags, subscriptions, MGs, cost) | 200 |
| 2 Storage | `d2-core`, `d2-ext1` (access & network security), `d2-ext2` (accounts, redundancy, encryption, tools), `d2-ext3` (Blob & Files) | 200 |
| 3 Compute | `d3-core`, `d3-ext1` (ARM/Bicep, VM creation, disks), `d3-ext2` (availability, operations, encryption, VMSS, moves), `d3-ext3` (containers, App Service) | 200 |
| 4 Networking | `d4-core`, `d4-ext1` (VNets, IPs, peering, VPN, routing), `d4-ext2` (NSG/ASG, Bastion, endpoints), `d4-ext3` (DNS, load balancing) | 200 |
| 5 Monitoring & backup | `d5-core`, `d5-ext1` (Monitor, KQL, alerts), `d5-ext2` (Network Watcher, Backup), `d5-ext3` (Site Recovery, monitoring design) | 200 |

Schema: [`src/app/data/schema.ts`](../src/app/data/schema.ts). Each question has `id`, `sub` (subtopic), `type`
(`mcq`/`multi`/`yesno`/`order`), `diff` (1–3), `q`, options/statements/items, `ans`, `exp`, and a
Microsoft Learn `link`.

## How to use

1. Each file has **questions first, answer key at the bottom** — attempt before scrolling.
2. Question tags: `[Type | Difficulty | Subtopic]`. Types: MCQ (single answer), MULTI (choose 2–3), YESNO (yes/no series), ORDER (sequence/matching), SCENARIO (case study).
3. In chat, tell Claude e.g. *"quiz me 10 random from Domain 4, medium"* — answers are tracked in your weak-areas record.
4. Wrong answers get logged; ask **"weak areas"** anytime for your accuracy report.

> These are original questions written from official Microsoft Learn documentation — not exam dumps.
