# Study Notes — Domain 1: Manage Azure Identities and Governance (20–25%)

Exam-focused cheat sheet. Pair with `question-bank/01-identities-governance.md`.

---

## 1. Microsoft Entra ID fundamentals

- **Tenant** = your org's identity directory. Default domain `*.onmicrosoft.com`; add **custom domains** by verifying a **TXT record** at your DNS registrar. Domain must be verified before users can use it in UPNs.
- **UPN** = sign-in name (`user@verified-domain`). Display name ≠ sign-in name.
- Subscription ↔ tenant: **one subscription trusts one tenant; one tenant can have many subscriptions.** Moving a subscription to another tenant **deletes all RBAC assignments**.
- Deleted users: **soft-deleted 30 days**, fully restorable (properties + memberships).
- **Member vs Guest:** guests are invited (B2B), sign in with their home credentials, have restricted default directory permissions, `userType` editable after creation. Guests CAN hold Entra admin roles and RBAC roles.
- Default user permissions (can be disabled in **User settings**): register apps, invite guests, create groups. "Stop users registering apps" → User settings, NOT Conditional Access/RBAC/Policy.
- Devices: **Entra registered** = BYOD/personal · **Entra joined** = corporate cloud devices · **Hybrid joined** = corporate + on-prem AD.
- Bulk user create/invite/delete = **CSV upload** in portal.
- Current PowerShell = **Microsoft Graph** (`New-MgUser`, `Update-MgUser`); AzureAD/MSOnline modules are deprecated.

## 2. Groups

| | Security | Microsoft 365 |
|---|---|---|
| Contains | users, **devices**, SPs, groups | users only |
| Use | access, RBAC, licensing | Teams/SharePoint/mailbox collaboration |

- Membership: **Assigned** (manual, free) · **Dynamic user** / **Dynamic device** (rule-based, **P1 required**). One group = dynamic users OR devices, never both.
- Dynamic rules: `user.department -eq "Sales"`, `device.deviceOSType -eq "Windows"`. Updates are automatic but take minutes.
- Group owners must be users/service principals (not groups).
- Nested groups: not supported for licensing or dynamic rules.

## 3. Licenses

- **P1:** dynamic groups, SSPR **writeback**, Conditional Access, group-based licensing.
- **P2:** P1 + **PIM**, Identity Protection (risk), access reviews. Keyword mapping: "risk/PIM/review" → P2.
- **Group-based licensing:** assign to group, members inherit. #1 error cause = missing **usageLocation**. Direct + inherited licenses coexist. Removing from group removes inherited license.

## 4. SSPR

- Scope: **None / Selected (ONE group) / All**.
- Methods: admin chooses available methods + **1 or 2 required**. Admin accounts: always 2 methods, **no security questions**.
- Registration: force at next sign-in; reconfirm every 180 days (default).
- Hybrid: cloud→on-prem sync needs **P1 + password writeback** (enable in BOTH Entra Connect and the Password reset blade).
- Notifications: can alert all admins when an admin password is reset.

## 5. Azure RBAC

Role assignment = **principal + role definition + scope**. Scopes: management group → subscription → RG → resource (inherits down). Permissions are **additive** (union); no "most restrictive".

| Role | Resources | Grant access |
|---|---|---|
| Owner | ✔ | ✔ |
| Contributor | ✔ | ✘ |
| Reader | view | ✘ |
| User Access Administrator | ✘ | ✔ |

- Least privilege favorites: Virtual Machine Contributor, Network Contributor, Storage Blob Data Reader/Contributor (DATA plane!), Support Request Contributor, Billing Reader.
- **Control vs data plane:** Reader on storage ≠ read blobs; need Storage Blob Data roles.
- **Entra roles ≠ RBAC.** Global Admin has no Azure access by default; **elevate access** toggle → UAA at root `/` (temporary).
- Custom roles: `Actions`, `NotActions` (subtract within the role — NOT a deny), `DataActions`, `AssignableScopes` (no `/` root for custom roles). Create: IAM → Roles → clone, or `az role definition create`.
- Deny assignments: only created by Azure (Blueprints/managed apps), never directly by admins.
- Best practice: assign roles to **groups** (limit: 4,000 assignments/subscription).
- Deleted principal → "Identity not found" assignment remains.
- Verify access: IAM → **Check access**.
- CLI: `az role assignment create --assignee X --role Y --resource-group Z` · `az role assignment list --assignee X --all`.

## 6. Azure Policy

- **Policy = WHAT resources may be/become. RBAC = WHO may act.** They're independent; Policy denies even Owners.
- **Effects:** `Deny` (block create/update) · `Audit` (flag only) · `AuditIfNotExists` · `DeployIfNotExists` (auto-deploy missing config; remediation runs under a **managed identity**) · `Modify` (fix properties/tags) · `Append` (add fields) · `Disabled`.
- **Initiative** = bundle of policies assigned as one.
- Assignment scope: MG / subscription / RG, with **exclusions**; **exemptions** for time-boxed waivers.
- Existing non-compliant resources: NOT deleted/stopped — only **marked non-compliant** (Deny only blocks new/updated).
- Evaluation: on create/update, on assignment, and ~every 24h.
- Classics: "Allowed locations", "Allowed resource types", "Allowed VM SKUs", "Require tag", "Inherit tag from RG" (Modify).

## 7. Resource locks

- **CanNotDelete** (Delete): read/modify OK, delete blocked. · **ReadOnly**: only reads — trap: POST ops like **listKeys fail** → storage browsing breaks.
- Inherited by all child resources. Applies to EVERYONE (Owner included) until removed.
- Manage locks: needs `Microsoft.Authorization/locks/*` → **Owner / User Access Administrator** only.
- Lock vs Policy: lock protects existing resources from delete/change; policy governs configurations at deploy time.

## 8. Tags

- Name/value metadata; up to **50 tags** per resource/RG/subscription.
- **NOT inherited** from RG by default → use the built-in **"Inherit a tag" policy (Modify)** to force it.
- Used heavily for **cost reporting** (group costs by tag).
- Not all resource types support tags; classic resources don't.

## 9. Resource groups & subscriptions

- RG = lifecycle container; **deleting an RG deletes everything inside**.
- RG has a region (stores metadata) but can hold resources from **any region**.
- **Move** resources between RGs/subscriptions: supported for most types; source+target locked during move; **region never changes**; resource IDs change. Validate with the move validation API.
- Resource can be in only ONE resource group at a time.

## 10. Management groups

- Hierarchy above subscriptions; **6 levels deep** (excluding root + subscriptions). Single **root MG** per tenant.
- RBAC **and** Policy assigned at an MG inherit to all child MGs/subscriptions/resources.
- New subscriptions land in the root MG by default (configurable).
- Design answer for "apply policy to many subscriptions with least effort" → management group.

## 11. Cost management

- **Budgets**: thresholds + alerts (email/action groups). Budgets NEVER stop resources by themselves; pair an action group + automation to deallocate.
- **Cost analysis**: slice by tag/RG/service; forecast.
- **Azure Advisor**: recommendations in 5 pillars — Cost, Security, Reliability, Performance, Operational excellence. Cost examples: resize/shutdown underused VMs, reserved instances.
- Pricing calculator (pre-deploy estimate) vs TCO calculator (on-prem comparison) vs Cost analysis (actual spend).

---

## ⚡ Rapid-fire traps
1. Subscription → new tenant = RBAC wiped.
2. ReadOnly lock breaks listKeys/POST operations.
3. Contributor can't grant access.
4. Tags & locks: tags don't inherit; locks DO inherit.
5. Dynamic groups/SSPR-writeback/CA = P1; PIM/risk/reviews = P2.
6. usageLocation before licensing.
7. Policy beats RBAC (deny applies to Owner too).
8. "Least administrative effort" almost always = group / management group / policy inheritance.

📎 [Study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) · [Entra fundamentals](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) · [RBAC](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview) · [Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview) · [Locks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources) · [Management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
