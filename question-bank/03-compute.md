# Domain 3 — Deploy and Manage Azure Compute Resources (20–25%)

50 questions · Answer key at the bottom — attempt first!
Subtopics: ARM templates & Bicep · Virtual machines · Containers (ACR, ACI, Container Apps) · App Service

---

## Section A — ARM templates and Bicep (Q1–Q12)

### Q1 [MCQ | Easy | ARM]
Which four top-level sections are most commonly used in an ARM template?
- A. parameters, variables, resources, outputs
- B. inputs, logic, actions, results
- C. header, body, footer, schema
- D. users, roles, scopes, locks

### Q2 [MCQ | Medium | ARM]
In an ARM template, what is the difference between a parameter and a variable?
- A. None
- B. Parameters accept values at deployment time; variables are computed inside the template and cannot be set by the deployer
- C. Variables are typed; parameters are not
- D. Parameters are only for passwords

### Q3 [MCQ | Hard | ARM]
You deploy a template to a resource group in **Complete** mode. The RG contains a VM that is NOT in the template. What happens?
- A. The VM is left untouched
- B. The VM is deleted
- C. The deployment fails
- D. The VM is stopped

### Q4 [MCQ | Easy | ARM]
Which is the DEFAULT deployment mode?
- A. Complete
- B. Incremental
- C. Validate
- D. Overwrite

### Q5 [MCQ | Medium | ARM]
Before deploying a modified template to production, you want to preview exactly which resources would change without deploying. Use:
- A. `az deployment group create --confirm-with-what-if` / the what-if operation
- B. `az group delete --dry-run`
- C. Azure Advisor
- D. Activity log

### Q6 [MCQ | Medium | ARM]
Which CLI command deploys a template file to a resource group?
- A. `az deployment group create --resource-group RG1 --template-file azuredeploy.json`
- B. `az group deploy start azuredeploy.json`
- C. `az arm push azuredeploy.json`
- D. `az template deploy RG1`

### Q7 [MCQ | Easy | ARM]
You configured a VM manually in the portal and want a template representing it to redeploy later. The quickest built-in option is:
- A. Write the template from scratch
- B. Use "Export template" on the resource/resource group
- C. Screenshot the configuration
- D. Azure Policy

### Q8 [MCQ | Medium | Bicep]
Which statement about Bicep is TRUE?
- A. Bicep deploys through a separate engine than ARM
- B. Bicep transpiles to ARM JSON; anything deployable with ARM templates works with Bicep
- C. Bicep supports only VMs
- D. Bicep files must be converted manually before every deployment

### Q9 [MCQ | Medium | Bicep]
Which command converts an existing ARM JSON template into a Bicep file?
- A. `az bicep decompile --file azuredeploy.json`
- B. `az bicep build`
- C. `az bicep export`
- D. `bicep deploy azuredeploy.json`

### Q10 [MCQ | Hard | Bicep]
In a Bicep file, how do you reference the name of a storage account resource declared as `resource stg 'Microsoft.Storage/storageAccounts@2023-01-01' = {...}`?
- A. `[reference(stg).name]`
- B. `stg.name`
- C. `${stg}.name`
- D. `resources('stg').name`

### Q11 [MCQ | Medium | ARM functions]
In ARM JSON, `"[parameters('location')]"` is an example of:
- A. A comment
- B. A template expression calling a template function
- C. A variable declaration
- D. Invalid syntax

### Q12 [YESNO | Medium | Templates]
Answer Yes or No:
1. Complete mode is supported only for resource group deployments (not subscription level).
2. A template can deploy resources to more than one resource group using nested/linked deployments.
3. secureString parameter values are logged in deployment history.
4. Bicep supports modules for reusing code.

---

## Section B — Virtual machines (Q13–Q30)

### Q13 [MCQ | Easy | Availability]
What SLA do you get for two or more VMs deployed across two or more Availability Zones in the same region?
- A. 99.9%
- B. 99.95%
- C. 99.99%
- D. 100%

### Q14 [MCQ | Medium | Availability]
An availability set with default settings protects against: (best answer)
- A. Region-wide outages
- B. Hardware rack failures (fault domains) and planned maintenance reboots (update domains) within a datacenter
- C. Zone failures
- D. Accidental deletion

### Q15 [MCQ | Medium | Availability]
Max fault domains and update domains configurable in an availability set:
- A. 2 FD / 5 UD
- B. 3 FD / 20 UD
- C. 5 FD / 10 UD
- D. 10 FD / 10 UD

### Q16 [MCQ | Hard | Availability]
You deployed VM1 without an availability set. You now want VM1 inside AVSet1. What must you do?
- A. Edit the VM's availability settings in the portal
- B. You must delete and recreate the VM (keeping its disks/NIC) — a VM can only join an availability set at creation
- C. Move it with az vm update
- D. Stop and restart the VM

### Q17 [MCQ | Easy | Disks]
Which managed disk type offers the highest performance (sub-millisecond latency, configurable IOPS/throughput) for critical workloads?
- A. Standard HDD
- B. Standard SSD
- C. Premium SSD
- D. Ultra Disk

### Q18 [MCQ | Medium | Disks]
A single VM (no availability set/zone) must qualify for a 99.9% SLA. What's required?
- A. Any disk type
- B. Premium SSD (or Ultra) for all OS and data disks
- C. Standard SSD
- D. Accelerated networking

### Q19 [MCQ | Medium | Encryption]
Azure Disk Encryption (ADE) uses which technologies for Windows and Linux respectively?
- A. SSE and TDE
- B. BitLocker and dm-crypt
- C. EFS and LUKS2 only
- D. Always Encrypted

### Q20 [MCQ | Hard | Encryption]
ADE requires which supporting resource, with which constraint?
- A. A storage account in any region
- B. An Azure Key Vault in the same region and subscription as the VM
- C. A Log Analytics workspace
- D. An HSM on-premises

### Q21 [MCQ | Medium | Encryption]
"Encryption at host" differs from ADE because it:
- A. Encrypts data on the VM host itself (temp/cache/data flows), with no agent or extension inside the VM
- B. Is only for Linux
- C. Requires BitLocker
- D. Works only with unmanaged disks

### Q22 [MCQ | Medium | Sizing]
You resize a VM to a size NOT available on the current hardware cluster. What is required?
- A. Nothing — live resize
- B. Deallocate (stop) the VM first, then resize
- C. Delete the VM
- D. Move to another subscription

### Q23 [MCQ | Hard | Moving]
You must move a VM to a DIFFERENT REGION. The supported approach is:
- A. Change the region in the VM properties
- B. Use Azure Resource Mover (or Site Recovery) to replicate and move it
- C. az vm move --region
- D. Export template and change location only — disks move automatically

### Q24 [MCQ | Medium | Moving]
Moving a VM to another resource group or subscription: which statement is true?
- A. The VM must be deleted first
- B. Supported; dependent resources (disks, NIC, VNet considerations) must move together, and resource IDs change
- C. Only possible for stopped VMs via support ticket
- D. Changes the VM's region

### Q25 [MCQ | Easy | VMSS]
Azure Virtual Machine Scale Sets are primarily used to:
- A. Back up VMs
- B. Deploy and automatically scale a set of identical (or flexible) VMs based on demand
- C. Encrypt VMs
- D. Monitor VMs

### Q26 [MCQ | Medium | VMSS]
An autoscale rule: "if average CPU > 75% for 10 minutes, add 2 instances; max 10". Current: 9 instances, CPU 80% for 15 min. What happens?
- A. 2 instances added (11 total)
- B. 1 instance added — the maximum cap of 10 is respected
- C. Nothing
- D. Autoscale disables itself

### Q27 [MCQ | Hard | VMSS]
Which VMSS orchestration mode lets you mix your own manually created VMs with scale-set managed instances and different VM types?
- A. Uniform
- B. Flexible
- C. Classic
- D. Hybrid

### Q28 [MCQ | Medium | VM creation]
Which CLI creates a Linux VM with SSH keys generated automatically?
- A. `az vm create -g RG1 -n VM1 --image Ubuntu2204 --generate-ssh-keys`
- B. `az vm new -n VM1 --os linux`
- C. `az compute vm create VM1`
- D. `New-AzVM -Linux`

### Q29 [YESNO | Hard | VMs]
Answer Yes or No:
1. Stopping (deallocating) a VM releases its dynamic public IP unless the IP is static.
2. A VM can be added to an availability zone after creation without recreating it.
3. Spot VMs can be evicted when Azure needs the capacity back.
4. Resizing a VM in an availability set may require deallocating ALL VMs in the set (if the new size needs different hardware).

### Q30 [ORDER | Medium | VM deploy]
Order the steps to deploy a VM whose disks are encrypted with ADE using a key encryption key (KEK):
1. Create a Key Vault with enabled-for-disk-encryption
2. Create the KEK in the vault
3. Create/identify the target VM
4. Run Set-AzVMDiskEncryptionExtension referencing vault and KEK

---

## Section C — Containers: ACR, ACI, Container Apps (Q31–Q40)

### Q31 [MCQ | Easy | ACR]
Which Azure Container Registry SKU supports geo-replication?
- A. Basic
- B. Standard
- C. Premium
- D. All SKUs

### Q32 [MCQ | Medium | ACR]
Which command builds an image in the cloud (no local Docker needed) and pushes it to the registry in one step?
- A. `docker push`
- B. `az acr build --registry myacr --image app:v1 .`
- C. `az acr import`
- D. `az container create`

### Q33 [MCQ | Medium | ACR]
A VM-based app must pull images from ACR without storing credentials. Best practice:
- A. Admin account enabled, password in code
- B. Use a managed identity granted the AcrPull role on the registry
- C. Anonymous pull for everything
- D. SSH keys

### Q34 [MCQ | Easy | ACI]
Azure Container Instances is best suited for:
- A. Long-running orchestrated microservice fleets
- B. Fast, serverless, per-second-billed single containers or small container groups (burst jobs, simple apps)
- C. Replacing all VMs
- D. Running Hyper-V

### Q35 [MCQ | Medium | ACI]
In an ACI container group, the containers:
- A. Run on separate hosts
- B. Share the same host, lifecycle, local network (localhost) and can share volumes
- C. Cannot communicate
- D. Must use different OS types in one group

### Q36 [MCQ | Medium | ACI]
Which restart policy makes an ACI container behave like a run-once batch job (billed only while running)?
- A. Always
- B. OnFailure or Never
- C. Continuous
- D. Scheduled

### Q37 [MCQ | Medium | Container Apps]
Which capability does Azure Container Apps have that ACI does NOT?
- A. Running Linux containers
- B. Built-in autoscaling (including scale to zero) with KEDA, revisions, and traffic splitting
- C. Public IP addresses
- D. Environment variables

### Q38 [MCQ | Hard | Container Apps]
An event-driven container app should run zero instances when the queue is empty and scale out as messages arrive. Configure:
- A. Minimum replicas = 0 with a KEDA queue-based scale rule
- B. A VM with cron
- C. Always-on = true
- D. Manual scaling

### Q39 [MCQ | Medium | Containers general]
You need to run a Windows container with the least management overhead for a short-lived task. Choose:
- A. AKS cluster
- B. Azure Container Instances
- C. App Service Free tier
- D. VMSS

### Q40 [YESNO | Medium | Containers]
Answer Yes or No:
1. ACR Basic/Standard/Premium differ in storage and throughput; all store Docker/OCI images.
2. An ACI container group with multiple containers is Linux-only.
3. Container Apps is built on Kubernetes but does not expose the Kubernetes API to you.
4. ACI containers can mount Azure file shares as volumes.

---

## Section D — App Service (Q41–Q50)

### Q41 [MCQ | Easy | Plans]
The App Service plan determines:
- A. Only the app's name
- B. The region, VM size/compute resources, and features available to all apps in the plan
- C. The DNS zone
- D. Only the pricing of storage

### Q42 [MCQ | Medium | Plans]
Which is the LOWEST standard (non-Premium) tier that supports deployment slots and scheduled backups?
- A. Free (F1)
- B. Basic (B1)
- C. Standard (S1)
- D. Shared (D1)

### Q43 [MCQ | Medium | Scaling]
Scale UP vs scale OUT for an App Service plan:
- A. Up = more instances; Out = bigger instances
- B. Up = a more powerful pricing tier/instance size; Out = more instances of the same size
- C. Both mean the same
- D. Out is only for VMs

### Q44 [MCQ | Medium | Scaling]
Autoscale (rule-based automatic scale out) requires at least which tier?
- A. Free
- B. Basic
- C. Standard
- D. Isolated only

### Q45 [MCQ | Medium | Slots]
The main benefit of swapping a staging slot into production (vs redeploying) is:
- A. Cheaper compute
- B. Zero-downtime deployment with pre-warmed instances, and instant swap-back if something breaks
- C. Automatic code review
- D. Free SSL

### Q46 [MCQ | Hard | Slots]
During a swap, which settings do NOT follow the app content (they stick to the slot) when marked as slot settings?
- A. All settings always swap
- B. App settings/connection strings marked "Deployment slot setting" stay with their slot
- C. Only TLS certificates
- D. The app's code stays; settings always swap

### Q47 [MCQ | Medium | Custom domain]
To map www.contoso.com to an App Service app, you create which DNS record (and what does Azure use to verify ownership)?
- A. A CNAME to the app's azurewebsites.net hostname (plus TXT asuid verification record)
- B. An MX record
- C. An SRV record
- D. An NS delegation

### Q48 [MCQ | Medium | TLS]
Which statement about App Service managed certificates (free) is TRUE?
- A. They support wildcard domains
- B. They cover custom domains with auto-renewal, but do NOT support wildcards, and cannot be exported
- C. They require purchasing from a CA
- D. They work on the Free tier

### Q49 [MCQ | Hard | Networking]
An App Service app must call a database on a private IP inside your VNet. Which feature do you enable?
- A. Access restrictions
- B. Regional VNet integration (outbound)
- C. A private endpoint on the app (inbound)
- D. Hybrid connections only

### Q50 [SCENARIO | Hard | App Service mixed]
A production web app runs on plan S1 with 1 instance. Requirements: deploy new versions with no downtime; handle CPU spikes automatically up to 5 instances; restrict public access so only the corporate office IP can browse the app; nightly backup.
1. Which feature gives no-downtime deployments?
2. What do you configure for the CPU-based scaling?
3. Where do you restrict access to the office IP?
4. Does S1 support the backup requirement?

---
---

# 🔑 Answer Key — Domain 3

**Q1 — A.** parameters, variables, resources, outputs (plus $schema, contentVersion, functions). 📎 [Template structure](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/syntax)

**Q2 — B.** Parameters = deploy-time input; variables = internal computed values. 📎 same.

**Q3 — B.** Complete mode deletes resources in the RG that aren't in the template — the classic trap question. 📎 [Deployment modes](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes)

**Q4 — B.** Incremental is default: adds/updates, never deletes. 📎 same.

**Q5 — A.** The what-if operation previews create/modify/delete per resource. 📎 [What-if](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-what-if)

**Q6 — A.** `az deployment group create` (PowerShell: `New-AzResourceGroupDeployment`). 📎 [Deploy CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-cli)

**Q7 — B.** Export template generates JSON from existing resources (may need cleanup). 📎 [Export template](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/export-template-portal)

**Q8 — B.** Bicep is a transparent abstraction over ARM; `bicep build` produces ARM JSON. 📎 [Bicep overview](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview)

**Q9 — A.** `az bicep decompile` JSON→Bicep; `az bicep build` is Bicep→JSON. 📎 [Decompile](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/decompile)

**Q10 — B.** Bicep uses symbolic names directly: `stg.name`. A ✗ that's ARM JSON style. 📎 [Bicep file structure](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/file)

**Q11 — B.** Bracket syntax = template expression; parameters() is a template function. 📎 [Template functions](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/template-functions)

**Q12 — 1 Yes** (complete mode: RG deployments only). **2 Yes. 3 No** (secureString values are not logged/saved). **4 Yes** (Bicep modules). 📎 [Deployment modes](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes)

**Q13 — C.** Zones: 99.99%. Availability set: 99.95%. Single VM with Premium SSD: 99.9%. Memorize this ladder. 📎 [VM SLA](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services)

**Q14 — B.** FDs = separate racks (power/network); UDs = maintenance groups. Not zone- or region-level protection. 📎 [Availability options](https://learn.microsoft.com/en-us/azure/virtual-machines/availability)

**Q15 — B.** 3 fault domains (region-dependent, 2–3) and up to 20 update domains. 📎 [Availability sets](https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview)

**Q16 — B.** Availability set membership is creation-time only — recreate the VM reusing disks. Same applies to moving into a zone. 📎 same.

**Q17 — D.** Ultra Disk: highest performance, adjustable IOPS/throughput independently of size. 📎 [Disk types](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types)

**Q18 — B.** Single-instance 99.9% SLA requires Premium SSD/Ultra on all disks. 📎 [VM SLA](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services)

**Q19 — B.** BitLocker (Windows), dm-crypt (Linux). 📎 [ADE overview](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview)

**Q20 — B.** Key Vault must be in the same region and subscription as the VM, with enabled-for-disk-encryption access policy. 📎 same.

**Q21 — A.** Encryption at host encrypts at the hypervisor host, agentless, covering temp disks and disk caches too; must be enabled as a subscription feature. 📎 [Encryption at host](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption)

**Q22 — B.** Sizes on another cluster require deallocation first. 📎 [Resize VM](https://learn.microsoft.com/en-us/azure/virtual-machines/resize-vm)

**Q23 — B.** Cross-region moves use Azure Resource Mover / Site Recovery replication; there is no in-place region change. 📎 [Move across regions](https://learn.microsoft.com/en-us/azure/resource-mover/tutorial-move-region-virtual-machines)

**Q24 — B.** RG/subscription moves are supported with dependencies; region never changes during such a move. 📎 [Move resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/move-resource-group-and-subscription)

**Q25 — B.** VMSS = identical/flexible VM fleet + autoscale + LB integration. 📎 [VMSS overview](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview)

**Q26 — B.** Autoscale never exceeds max; it adds only up to the cap. 📎 [Autoscale](https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-overview)

**Q27 — B.** Flexible orchestration mixes manual VMs + scale-managed instances, multiple sizes, better FD spreading. 📎 [Orchestration modes](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-orchestration-modes)

**Q28 — A.** `az vm create ... --generate-ssh-keys`. 📎 [az vm create](https://learn.microsoft.com/en-us/cli/azure/vm#az-vm-create)

**Q29 — 1 Yes** (dynamic IPs are released on deallocate; static persists). **2 No** (zone is creation-time; recreate or use Resource Mover). **3 Yes. 4 Yes** (classic trap: "resize requires stopping all VMs in the availability set" when new hardware is needed). 📎 [Resize VM](https://learn.microsoft.com/en-us/azure/virtual-machines/resize-vm)

**Q30 — Order: 1 → 2 → 3 → 4.** Vault (enabled for disk encryption) → KEK → VM → run the encryption extension referencing both. 📎 [ADE Windows](https://learn.microsoft.com/en-us/azure/virtual-machines/windows/disk-encryption-windows)

**Q31 — C.** Geo-replication = Premium only (also content trust, private link). 📎 [ACR SKUs](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-skus)

**Q32 — B.** `az acr build` runs the build in ACR Tasks and pushes automatically. 📎 [ACR Tasks](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-overview)

**Q33 — B.** Managed identity + AcrPull = credential-free pulls. A ✗ admin account is discouraged. 📎 [ACR auth with MI](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-authentication-managed-identity)

**Q34 — B.** ACI = serverless containers, per-second billing, fast start; not an orchestrator. 📎 [ACI overview](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview)

**Q35 — B.** Container group ≈ pod: shared host, lifecycle, localhost network, volumes. 📎 [Container groups](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-container-groups)

**Q36 — B.** OnFailure/Never = task-based; container stops when done. Always = long-running service. 📎 [Restart policy](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-restart-policy)

**Q37 — B.** Container Apps: KEDA autoscaling (to zero), revisions, traffic splitting, Dapr. 📎 [Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)

**Q38 — A.** Min replicas 0 + KEDA scale rule on queue length. 📎 [Container Apps scaling](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)

**Q39 — B.** ACI supports Windows containers for quick, low-management runs. 📎 [ACI overview](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview)

**Q40 — 1 Yes. 2 Yes** (multi-container groups are Linux-only). **3 Yes. 4 Yes** (Azure Files volume mounts, Linux containers). 📎 [ACI volumes](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-volume-azure-files)

**Q41 — B.** Plan = region + size + features; apps in the plan share its instances. 📎 [App Service plans](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans)

**Q42 — C.** Standard S1 is the first tier with slots (5) and backups. Basic has neither slots nor scheduled backup (Basic gained some backup ability, but Standard is the exam-safe answer). 📎 [App Service limits](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#app-service-limits)

**Q43 — B.** Up = tier/size; Out = instance count. 📎 [Scale up](https://learn.microsoft.com/en-us/azure/app-service/manage-scale-up)

**Q44 — C.** Autoscale rules: Standard and above. Basic = manual scale only. 📎 [Autoscale](https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-get-started)

**Q45 — B.** Swap = pre-warmed, near-zero downtime, instant rollback by swapping back. 📎 [Deployment slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots)

**Q46 — B.** Settings marked "Deployment slot setting" are sticky to the slot (e.g., prod connection string stays in prod). 📎 same.

**Q47 — A.** CNAME www → app.azurewebsites.net; TXT asuid.www proves ownership. (Apex/root domains use A + TXT.) 📎 [Map custom domain](https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain)

**Q48 — B.** Free managed certs: auto-renewed, no wildcard, not exportable, require Basic tier or higher. 📎 [Add TLS cert](https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate)

**Q49 — B.** Outbound into a VNet = regional VNet integration. C ✗ private endpoint is for inbound to the app. 📎 [VNet integration](https://learn.microsoft.com/en-us/azure/app-service/overview-vnet-integration)

**Q50 — 1:** Deployment slots (swap staging→production). **2:** Autoscale rule: scale out on CPU > threshold, max 5 (S1 supports autoscale). **3:** Networking → Access restrictions: allow office IP, deny all. **4:** Yes — Standard supports scheduled backups. 📎 [Slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots) · [Access restrictions](https://learn.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions)
