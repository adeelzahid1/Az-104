# Domain 1 — Manage Azure Identities and Governance (20–25%)

50 questions · Answer key at the bottom — attempt first!
Subtopics: Entra users & groups · Access to Azure resources (RBAC) · Subscriptions & governance (Policy, locks, tags, management groups, cost)

---

## Section A — Microsoft Entra users and groups (Q1–Q16)

### Q1 [MCQ | Easy | Users]
You need to create 25 users in Microsoft Entra ID. Each user must sign in with the suffix `@contoso.com`. What must you do FIRST?
- A. Create a Microsoft 365 group named contoso.com
- B. Add and verify the custom domain contoso.com in the tenant
- C. Purchase Entra ID P1 licenses for all 25 users
- D. Create a DNS zone named contoso.com in Azure DNS

### Q2 [MCQ | Easy | Users]
A user account was deleted 10 days ago. What is the simplest way to get the account back with all its properties and group memberships intact?
- A. Create a new user with the same UPN
- B. Restore the user from the Deleted users blade
- C. Restore the tenant from a backup
- D. Re-invite the user as a guest

### Q3 [MCQ | Medium | Users]
How long does Microsoft Entra ID keep a deleted user in a restorable (soft-deleted) state?
- A. 14 days
- B. 30 days
- C. 90 days
- D. 7 days

### Q4 [MCQ | Easy | External users]
You invite an external consultant (anna@fabrikam.com) to collaborate. Which statement is true about her account in your tenant?
- A. You must set an initial password for her
- B. She authenticates with her own organization's credentials; her userType is Guest
- C. She automatically gets the same default permissions as members
- D. She can only be added to Microsoft 365 groups, not security groups

### Q5 [MCQ | Medium | Groups]
Which group configuration requires a Microsoft Entra ID P1 license?
- A. A security group with assigned membership
- B. A Microsoft 365 group with assigned membership
- C. A security group with dynamic user membership
- D. A group used for sharing a SharePoint site

### Q6 [MCQ | Medium | Groups]
You create a dynamic user group with the rule `user.department -eq "Sales"`. A user's department attribute is changed from "HR" to "Sales". What happens?
- A. Nothing until an admin runs a sync
- B. The user is added to the group automatically after the rule is processed
- C. The user receives an email invitation to join the group
- D. The user is added only after their next sign-in

### Q7 [MCQ | Medium | Groups]
Which group type can contain devices as members?
- A. Microsoft 365 group
- B. Security group
- C. Distribution group
- D. Mail-enabled security group

### Q8 [MULTI | Medium | Groups] (Choose 2)
A dynamic device group is being designed. Which TWO statements are true?
- A. A group can use dynamic membership for both users and devices at the same time
- B. A group can have dynamic membership for users OR devices, not both
- C. Dynamic membership rules can reference device properties such as deviceOSType
- D. Device objects can only be placed in Microsoft 365 groups

### Q9 [MCQ | Hard | Licenses]
You assign licenses to the group "Sales-Users" using group-based licensing. One user shows a licensing error. The most common cause tested is:
- A. The user is a guest
- B. The user has no usageLocation set
- C. The user is in two groups
- D. The group is a security group

### Q10 [MCQ | Medium | Licenses]
Which features require Microsoft Entra ID P2 rather than P1? 
- A. Conditional Access
- B. Dynamic groups
- C. Privileged Identity Management (PIM) and Identity Protection
- D. Self-service password reset with on-premises writeback

### Q11 [MCQ | Easy | SSPR]
Self-service password reset (SSPR) can be enabled for:
- A. All users only — no scoping possible
- B. None, selected groups, or all users
- C. Individual users picked one by one
- D. Only users with the Global Administrator role

### Q12 [MCQ | Medium | SSPR]
Your hybrid environment syncs users from on-premises AD. Users who reset their password in the cloud must have the new password written back to on-premises AD. What do you need?
- A. Entra ID Free + Entra Connect
- B. Entra ID P1 (or higher) and password writeback enabled in Entra Connect
- C. Entra ID P2 only
- D. Microsoft Identity Manager

### Q13 [YESNO | Medium | Users/Groups]
Answer Yes or No to each:
1. A guest user can be assigned an Entra ID administrative role.
2. The userType of a user can be changed from Guest to Member after creation.
3. A security group can be an owner of another group.
4. Changing a user's display name changes their sign-in name.

### Q14 [MCQ | Medium | Bulk operations]
You need to create 200 users at once in the portal. The supported method is:
- A. Upload a CSV file using the Bulk create operation in the Users blade
- B. Upload a JSON file in the Users blade
- C. Paste the list into the New user form
- D. Bulk create is only possible with PowerShell

### Q15 [MCQ | Hard | Default permissions]
Management wants to prevent standard (non-admin) users from registering applications in the tenant. Where do you configure this?
- A. Conditional Access policy
- B. Azure RBAC on the subscription
- C. Entra ID → Users → User settings → App registrations = No
- D. Azure Policy assignment at tenant root

### Q16 [MCQ | Medium | Devices]
Which option allows users to join their personal Windows devices to the company directory while keeping personal ownership (BYOD scenario)?
- A. Microsoft Entra join
- B. Microsoft Entra registered
- C. Hybrid Entra join
- D. Domain join

---

## Section B — Manage access to Azure resources / RBAC (Q17–Q32)

### Q17 [MCQ | Easy | Built-in roles]
Which built-in role lets a user create and manage all resources in a resource group but NOT grant access to others?
- A. Owner
- B. Contributor
- C. User Access Administrator
- D. Reader

### Q18 [MCQ | Easy | Built-in roles]
Which built-in role can manage user access to Azure resources but cannot create or modify the resources themselves?
- A. Owner
- B. Contributor
- C. User Access Administrator
- D. Security Admin

### Q19 [MCQ | Medium | Scopes]
A role assigned at the subscription scope applies to:
- A. Only the subscription object itself
- B. The subscription and all resource groups and resources within it (inherited)
- C. Only resource groups created after the assignment
- D. The whole management group

### Q20 [MCQ | Medium | Scopes]
What are the three elements that make up an Azure role assignment?
- A. User, password, resource
- B. Security principal, role definition, scope
- C. Role definition, policy, subscription
- D. Group, license, scope

### Q21 [MCQ | Hard | Interpret assignments]
User1 has Reader on subscription Sub1 and Contributor on resource group RG1 (inside Sub1). What can User1 do in RG1?
- A. Only read resources (Reader wins — most restrictive)
- B. Create, modify, and delete resources (permissions are additive; Contributor applies in RG1)
- C. Nothing — conflicting assignments cancel out
- D. Only actions common to both roles

### Q22 [MCQ | Medium | RBAC vs Entra roles]
The Global Administrator of the tenant cannot see any Azure resources in a subscription. Why?
- A. Entra ID roles and Azure RBAC roles are separate; Global Admin has no RBAC role by default
- B. The subscription is disabled
- C. Global Admins are blocked from Azure resources
- D. They need an Entra ID P2 license

### Q23 [MCQ | Hard | Elevate access]
A Global Administrator needs temporary access to manage ALL subscriptions in the tenant to fix orphaned access. The supported mechanism is:
- A. Assign Owner on each subscription one by one
- B. Toggle "Access management for Azure resources" (elevate access) to get User Access Administrator at root scope (/)
- C. Create a custom role at tenant scope
- D. Use Azure Policy to grant access

### Q24 [MCQ | Medium | Custom roles]
Which property of a custom RBAC role controls WHERE the role can be assigned?
- A. Actions
- B. NotActions
- C. AssignableScopes
- D. DataActions

### Q25 [MCQ | Hard | Custom roles]
A custom role must allow all read operations plus restarting VMs, nothing else. Which Actions block is correct?
- A. `"Actions": ["*/read", "Microsoft.Compute/virtualMachines/restart/action"]`
- B. `"Actions": ["*"], "NotActions": ["*/write"]`
- C. `"Actions": ["Microsoft.Compute/*"]`
- D. `"Actions": ["*/read"], "DataActions": ["restart"]`

### Q26 [MCQ | Medium | Custom roles]
NotActions in a role definition:
- A. Creates an explicit deny that overrides other roles
- B. Subtracts operations from the Actions of the SAME role definition only
- C. Blocks the user tenant-wide
- D. Is only valid in built-in roles

### Q27 [MULTI | Medium | Built-in roles] (Choose 2)
Which TWO role assignments allow a user to grant other users access to a resource group?
- A. Owner on the resource group
- B. Contributor on the resource group
- C. User Access Administrator on the resource group
- D. Reader on the subscription

### Q28 [MCQ | Easy | Tools]
Which CLI command assigns the Reader role to user ali@contoso.com on resource group RG1?
- A. `az role assignment create --assignee ali@contoso.com --role Reader --resource-group RG1`
- B. `az ad role create --user ali --role Reader`
- C. `az rbac grant --role Reader --rg RG1`
- D. `az role definition create --role Reader`

### Q29 [YESNO | Hard | RBAC]
Answer Yes or No:
1. A role assigned at management group scope is inherited by all subscriptions under it.
2. Deleting a user removes their role assignments' effect, but the assignment may remain as "Identity not found".
3. A deny assignment can be created directly by an administrator in the portal.
4. Azure RBAC role assignments apply to the Entra ID portal operations (like creating users).

### Q30 [MCQ | Medium | Interpret assignments]
You review access and see a group "Ops" has Contributor at the management group "Corp". Sub1 is in "Corp". User2 is in group "Ops". What is User2's effective role on resource group RG5 in Sub1?
- A. No access until assigned directly
- B. Contributor (inherited: MG → subscription → RG)
- C. Reader
- D. Owner only on RG5

### Q31 [MCQ | Hard | Built-in roles]
A user must be able to open support tickets for a subscription and nothing more. Best-practice role?
- A. Contributor
- B. Support Request Contributor
- C. Owner
- D. Billing Reader

### Q32 [ORDER | Medium | RBAC]
Put the steps in the correct order to grant a new vendor's engineer access to manage only VMs in RG-App:
1. Assign the "Virtual Machine Contributor" role at the RG-App scope
2. Invite the engineer as a guest user in Entra ID
3. The engineer redeems the invitation
4. Select the guest as the security principal

---

## Section C — Subscriptions and governance (Q33–Q50)

### Q33 [MCQ | Easy | Policy]
What is the difference between Azure Policy and Azure RBAC?
- A. They are the same service
- B. Policy controls WHAT can be done with resources (properties/compliance); RBAC controls WHO can do actions
- C. RBAC controls resource properties; Policy controls identities
- D. Policy applies only to users; RBAC only to groups

### Q34 [MCQ | Easy | Policy]
You must prevent anyone from creating virtual machines in regions outside West Europe. What do you use?
- A. A resource lock
- B. An Azure Policy with the "Allowed locations" definition assigned with a Deny effect
- C. An NSG
- D. RBAC custom role

### Q35 [MCQ | Medium | Policy]
A policy with the **Audit** effect finds a non-compliant resource. What happens to the resource?
- A. It is deleted
- B. It is stopped
- C. Nothing — it is only marked non-compliant in compliance reports
- D. It is automatically fixed

### Q36 [MCQ | Hard | Policy]
Which policy effect can automatically deploy a missing resource (e.g., deploy the monitoring agent if absent), and what does its remediation require?
- A. Append; requires nothing extra
- B. DeployIfNotExists; remediation task using a managed identity
- C. Deny; requires Owner role
- D. Modify; requires a service principal secret

### Q37 [MCQ | Medium | Policy]
What is an Azure Policy initiative?
- A. A policy that cannot be changed
- B. A group of policy definitions assigned together as one unit
- C. A policy assigned at tenant root
- D. A deny assignment

### Q38 [MCQ | Hard | Policy]
A policy denying public IP creation is assigned at the subscription. One resource group RG-Lab must be exempt. The BEST approach is:
- A. Move RG-Lab to another tenant
- B. Add RG-Lab as an exclusion (or create a policy exemption) on the assignment
- C. Delete the policy
- D. Assign a second policy allowing public IPs on RG-Lab

### Q39 [MCQ | Medium | Policy]
Existing non-compliant resources that were created BEFORE a Deny policy was assigned are:
- A. Deleted automatically
- B. Left running but reported as non-compliant
- C. Stopped automatically
- D. Moved to a quarantine resource group

### Q40 [MCQ | Easy | Locks]
Which lock type allows users to read and modify a resource but prevents deletion?
- A. ReadOnly
- B. CanNotDelete (Delete lock)
- C. NoDelete
- D. Protect

### Q41 [MCQ | Hard | Locks]
A ReadOnly lock is applied to a storage account. Which unexpected side effect is commonly tested?
- A. Blobs can no longer be read
- B. Operations like listing storage account keys fail, because list keys is a POST action
- C. The account is deleted after 30 days
- D. The firewall is disabled

### Q42 [MCQ | Medium | Locks]
A CanNotDelete lock is applied at the resource group level. Which statement is true?
- A. Only the resource group object is protected; resources inside can be deleted
- B. All resources within the resource group inherit the lock and cannot be deleted
- C. The lock expires after 90 days
- D. Owners can delete resources despite the lock without removing it

### Q43 [MCQ | Medium | Locks]
Which roles can create or delete management locks?
- A. Any Contributor
- B. Owner and User Access Administrator (Microsoft.Authorization/* access)
- C. Reader
- D. Only Global Administrator

### Q44 [MCQ | Easy | Tags]
Resource group RG1 has the tag `env=prod`. VM1 is created inside RG1. What tag does VM1 have?
- A. env=prod, inherited automatically
- B. No tags — tags are not inherited by default
- C. env=prod but read-only
- D. A system tag linking it to RG1

### Q45 [MCQ | Medium | Tags]
You must ensure every NEW resource gets the tag `costcenter` copied from its resource group automatically. What do you use?
- A. A resource lock
- B. The built-in Azure Policy "Inherit a tag from the resource group" with the Modify effect
- C. An ARM template
- D. Azure Advisor

### Q46 [MCQ | Medium | Resource groups]
You move a VM from RG1 to RG2 within the same subscription. Which statement is true?
- A. The VM's region changes to RG2's region
- B. The VM keeps its region; both resource groups are locked during the move
- C. The VM restarts during the move
- D. Moving VMs between resource groups is not supported

### Q47 [MCQ | Medium | Management groups]
How many levels of depth does a management group hierarchy support (excluding the root management group and subscriptions)?
- A. 3
- B. 6
- C. 10
- D. Unlimited

### Q48 [MCQ | Hard | Management groups]
You assign a policy at the "Corp" management group and an RBAC Reader role at the root management group to user Bob. Which statements apply to new subscription Sub9 placed under "Corp"? (best single answer)
- A. Neither applies until manually linked
- B. Both are inherited: Sub9 gets the policy, Bob can read Sub9's resources
- C. Only RBAC inherits, policies never inherit
- D. Only policy inherits, RBAC never inherits

### Q49 [MCQ | Medium | Cost management]
A monthly budget of $500 with an alert at 80% is configured on a subscription. Spending reaches $500. What happens to the running resources?
- A. All resources are deallocated automatically
- B. Nothing — budgets alert but never stop resources by themselves
- C. The subscription is cancelled
- D. New deployments are blocked

### Q50 [SCENARIO | Hard | Governance mixed]
Contoso has management group MG-Prod containing Sub1. RG-Fin in Sub1 has a CanNotDelete lock. A policy at MG-Prod denies creating resources outside West Europe. User1 has Contributor on Sub1.
1. Can User1 create a storage account in East US in RG-Fin?
2. Can User1 delete a VM inside RG-Fin?
3. Can User1 create a VM in West Europe in RG-Fin?
4. Can User1 remove the lock on RG-Fin?

---
---

# 🔑 Answer Key — Domain 1

**Q1 — B.** The UPN suffix must be a verified custom domain in the tenant. A ✗ groups don't control domains; C ✗ licenses aren't needed to create users; D ✗ Azure DNS zone alone doesn't verify the domain in Entra (verification uses a TXT record at your registrar). 📎 [Add custom domain](https://learn.microsoft.com/en-us/entra/fundamentals/add-custom-domain)

**Q2 — B.** Within 30 days, soft-deleted users can be restored with all properties. A ✗ a new user gets a new object ID and no memberships; C ✗ no tenant restore exists; D ✗ guest invite creates a different account type. 📎 [Restore deleted users](https://learn.microsoft.com/en-us/entra/fundamentals/users-restore)

**Q3 — B.** 30 days, then permanent deletion. 📎 same as Q2.

**Q4 — B.** B2B guests bring their own credentials; userType=Guest. A ✗ no password set by you; C ✗ guests have restricted default permissions; D ✗ guests can join security groups too. 📎 [B2B collaboration](https://learn.microsoft.com/en-us/entra/external-id/what-is-b2b)

**Q5 — C.** Dynamic membership (user or device) requires P1. A/B/D ✗ assigned-membership groups work on the Free tier. 📎 [Dynamic groups](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership)

**Q6 — B.** Dynamic rules are evaluated automatically on attribute change; membership updates without admin action (processing can take some minutes). 📎 same as Q5.

**Q7 — B.** Security groups can contain users, devices, service principals, and other groups. A ✗ Microsoft 365 groups contain users only. 📎 [Compare groups](https://learn.microsoft.com/en-us/entra/fundamentals/concept-learn-about-groups)

**Q8 — B and C.** One dynamic group targets users OR devices, never both; device rules use device properties. A ✗ mixed dynamic membership unsupported; D ✗ devices go in security groups. 📎 [Dynamic membership rules](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership)

**Q9 — B.** Group-based licensing fails for users without usageLocation (many services are region-restricted). A ✗ guests can be licensed; C ✗ multiple groups is fine (licenses merge); D ✗ security groups are the normal vehicle. 📎 [Group licensing problems](https://learn.microsoft.com/en-us/entra/identity/users/licensing-groups-resolve-problems)

**Q10 — C.** PIM, Identity Protection, access reviews = P2. A/B/D are P1 features. 📎 [Entra plans](https://learn.microsoft.com/en-us/entra/fundamentals/licensing)

**Q11 — B.** SSPR scoping: None / Selected (one group) / All. 📎 [SSPR how it works](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-howitworks)

**Q12 — B.** Password writeback requires P1+ and the writeback option in Entra Connect. C ✗ P2 not required; A ✗ Free doesn't include writeback. 📎 [SSPR writeback](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-writeback)

**Q13 — 1 Yes** (guests can hold admin roles), **2 Yes** (userType is editable), **3 No** (group owners must be users or service principals, not groups), **4 No** (display name ≠ UPN). 📎 [Default user permissions](https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions)

**Q14 — A.** Bulk create uses a CSV template downloaded from the portal. 📎 [Bulk create users](https://learn.microsoft.com/en-us/entra/identity/users/users-bulk-add)

**Q15 — C.** "Users can register applications" is a tenant User setting. A ✗ CA controls sign-in conditions; B ✗ RBAC governs Azure resources, not the directory; D ✗ Azure Policy targets Azure resources. 📎 [Default user permissions](https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions)

**Q16 — B.** Entra registered = personal/BYOD devices. A ✗ Entra join is for corporate-owned; C ✗ hybrid join is for on-prem domain-joined corporate machines. 📎 [Device identity](https://learn.microsoft.com/en-us/entra/identity/devices/overview)

**Q17 — B.** Contributor manages resources but cannot assign roles. A ✗ Owner can also grant access; C ✗ UAA manages access only; D ✗ Reader is view-only. 📎 [Built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)

**Q18 — C.** User Access Administrator = manage access only. 📎 same.

**Q19 — B.** Scope inherits downward: MG → subscription → RG → resource. 📎 [RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)

**Q20 — B.** Principal + role definition + scope. 📎 same.

**Q21 — B.** RBAC is additive; the higher-privilege Contributor applies within RG1, Reader applies elsewhere in Sub1. 📎 [RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)

**Q22 — A.** Entra directory roles ≠ Azure resource roles; a Global Admin has no automatic subscription access. 📎 [Entra roles vs RBAC](https://learn.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles)

**Q23 — B.** The documented "elevate access" toggle grants UAA at root scope "/" — intended to be temporary. 📎 [Elevate access](https://learn.microsoft.com/en-us/azure/role-based-access-control/elevate-access-global-admin)

**Q24 — C.** AssignableScopes lists MGs/subscriptions/RGs where the role may be assigned. 📎 [Custom roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles)

**Q25 — A.** `*/read` grants all reads; add the specific restart action. B ✗ far too broad (allows delete/actions); C ✗ full compute control; D ✗ DataActions is for data-plane operations and that syntax is invalid. 📎 [Role definitions](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-definitions)

**Q26 — B.** NotActions only subtracts within the same role; it is NOT a deny — another role can still grant the operation. 📎 same as Q25.

**Q27 — A and C.** Owner and User Access Administrator include Microsoft.Authorization/roleAssignments/write. B ✗ Contributor explicitly excludes it; D ✗ Reader is view-only. 📎 [Built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)

**Q28 — A.** `az role assignment create` with --assignee, --role, and scope parameters. 📎 [Assign roles with CLI](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-cli)

**Q29 — 1 Yes; 2 Yes** (orphaned "Identity not found" assignments); **3 No** (deny assignments are created only by Azure, e.g. Blueprints/managed apps, not directly by admins); **4 No** (RBAC is for Azure resources; directory operations use Entra roles). 📎 [Deny assignments](https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments)

**Q30 — B.** Group membership + MG-scope assignment inherit all the way down to RG5. 📎 [RBAC scope](https://learn.microsoft.com/en-us/azure/role-based-access-control/scope-overview)

**Q31 — B.** Support Request Contributor = least privilege for creating support tickets. A/C ✗ over-privileged; D ✗ Billing Reader is for invoices. 📎 [Built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)

**Q32 — Order: 2 → 3 → 4 → 1.** Invite guest → they redeem → select them as principal → assign VM Contributor at RG scope. (In practice you can assign before redemption, but the exam-logical flow is invite→redeem→select→assign.) 📎 [B2B + RBAC](https://learn.microsoft.com/en-us/entra/external-id/what-is-b2b)

**Q33 — B.** Policy = resource compliance/properties; RBAC = identity permissions. 📎 [Policy overview](https://learn.microsoft.com/en-us/azure/governance/policy/overview)

**Q34 — B.** "Allowed locations" policy with Deny. A ✗ locks don't control creation properties; C ✗ NSG is network traffic; D ✗ RBAC can't filter by region. 📎 same.

**Q35 — C.** Audit only logs/flags non-compliance. 📎 [Policy effects](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effects)

**Q36 — B.** DeployIfNotExists + remediation task running under a managed identity. 📎 [Remediate resources](https://learn.microsoft.com/en-us/azure/governance/policy/how-to/remediate-resources)

**Q37 — B.** Initiative = policy set grouped and assigned together. 📎 [Initiative definition](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/initiative-definition-structure)

**Q38 — B.** Exclusions/exemptions are built for this. C ✗ removes protection everywhere; D ✗ a second "allow" policy can't override Deny (policies can only restrict). 📎 [Exemptions](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/exemption-structure)

**Q39 — B.** Deny blocks new/updated deployments only; existing resources are flagged non-compliant. 📎 [Policy effects](https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effects)

**Q40 — B.** CanNotDelete: modify OK, delete blocked. ReadOnly blocks modification too. 📎 [Lock resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources)

**Q41 — B.** ReadOnly restricts to GET; POST operations like listKeys fail — classic trap. 📎 same.

**Q42 — B.** Locks at a parent scope are inherited by all child resources; nobody (even Owner) bypasses without removing the lock first. 📎 same.

**Q43 — B.** Lock management needs Microsoft.Authorization/locks/* → Owner and User Access Administrator. 📎 same.

**Q44 — B.** Tags are not inherited by default. 📎 [Tag resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources)

**Q45 — B.** The built-in "Inherit a tag from the resource group" policy (Modify effect + remediation) automates inheritance. 📎 [Tag policies](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-policies)

**Q46 — B.** Moves don't change region or restart the VM; both source and destination RGs are locked during the operation. 📎 [Move resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/move-resource-group-and-subscription)

**Q47 — B.** Six levels of depth (root and subscription level not counted). 📎 [Management groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)

**Q48 — B.** Both Azure Policy and RBAC inherit down the management group hierarchy to new subscriptions automatically. 📎 same.

**Q49 — B.** Budgets alert (email/action groups); they never deallocate resources on their own — automation must be added (e.g., action group → runbook). 📎 [Budgets](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets)

**Q50 — 1 No** (policy denies non-West-Europe), **2 No** (CanNotDelete lock inherited), **3 Yes** (Contributor + compliant region + lock doesn't block create/modify), **4 No** (Contributor lacks Microsoft.Authorization/locks permissions). 📎 [Locks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources) · [Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview)
