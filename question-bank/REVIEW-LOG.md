# Question review log

Accuracy review against current Microsoft Learn documentation (November 2026).

**Reviewed:** Domains 1, 2 and 3 in full; Domain 4 core, ext1 and ext2.
**Not yet reviewed:** Domain 4 ext3 and exam set; all of Domain 5.

| Question | Kind | What changed | Source |
|---|---|---|---|
| D1-029 | outdated | Explanation named Azure Blueprints as the source of deny assignments; Microsoft Learn now describes deployment stacks (deny settings) as the generally available way Azure creates them. | [source](https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments) |
| D1-122 | inaccurate | The question equated the Tenant Root Group with the "/" root scope. They are different scopes: "/" sits above the Tenant Root Group and is used only for elevated access. | [source](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview) |
| D1-138 | unclear | Explanation of how Backup Contributor differs from Backup Operator was muddled. | [source](https://learn.microsoft.com/en-us/azure/backup/backup-rbac-rs-vault) |
| D1-159 | unclear | The correct option said individual resources could be assignment scopes "via exclusions/selectors", which mixes up assignment scopes and exclusions. | [source](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/scope) |
| D2-009 | outdated | Said a user delegation SAS works only for Blob storage. Microsoft Learn now lists Blob (including Data Lake), Queue, Table and Azure Files. | [source](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) |
| D2-044 | outdated | Said the default account access tier can only be hot or cool. Microsoft Learn now allows hot, cool or cold; archive still cannot be the default. | [source](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview) |
| D2-203 | inaccurate | Explanation claimed partners without Entra accounts rule out a user delegation SAS. The real reason is that a user delegation SAS cannot use a stored access policy, so it cannot be revoked on its own. | [source](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) |
| D2-136 | outdated | Relied on specific device capacities (80 TB Data Box, Data Box Heavy) that have changed with newer Data Box models. Rewritten around the scenario instead. | [source](https://learn.microsoft.com/en-us/azure/databox/data-box-overview) |
| D3-042 | outdated | Explanation said Standard is the first tier with scheduled backups. Microsoft Learn now lists automatic and custom (scheduled) backups for Basic and above. The answer (Standard) is still right, because deployment slots need Standard. | [source](https://learn.microsoft.com/en-us/azure/app-service/manage-backup) |
| D3-057 | unclear | Question said "without putting it in a parameter file" while the answer is a parameter-file reference to Key Vault. Reworded so the question and answer agree. | [source](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/key-vault-parameter) |
| D3-029 | outdated | Statement 1 tested dynamic public IPs being released on deallocation. Basic SKU public IPs (the only SKU with dynamic allocation) were retired on 30 September 2025; Standard public IPs are always static. | [source](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses) |
| D3-150 | outdated | Scenario used a dynamic public IP. Basic SKU public IPs were retired on 30 September 2025, and Standard public IPs are static. | [source](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses) |
