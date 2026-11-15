# Study Notes — Domain 3: Deploy and Manage Azure Compute Resources (20–25%)

Exam-focused cheat sheet. Pair with `question-bank/03-compute.md`.

---

## 1. ARM templates & Bicep

- ARM JSON sections: `parameters` (deploy-time input; `secureString` for secrets — never logged), `variables` (internal), `resources`, `outputs` (+ `functions`).
- Expressions: `"[parameters('x')]"`, `"[resourceGroup().location]"`, `"[concat(...)]"`.
- **Deployment modes:** **Incremental** (default — add/update, never delete) vs **Complete** (deletes resources NOT in the template; RG scope only). Complete-mode question = "the VM disappeared".
- **What-if** preview: `az deployment group create --what-if` / `--confirm-with-what-if`.
- Deploy: `az deployment group create -g RG1 --template-file main.bicep` · PS: `New-AzResourceGroupDeployment`.
- **Export template** from resource/RG for reuse; deployment history keeps the exact submitted template.
- **Bicep:** transpiles to ARM JSON (`az bicep build`); JSON→Bicep: `az bicep decompile`. Symbolic references: `stg.name`. Supports **modules**. Anything ARM can deploy, Bicep can.

## 2. Virtual machines

### Availability & SLA ladder (memorize)
| Deployment | SLA |
|---|---|
| 2+ VMs across **availability zones** | **99.99%** |
| 2+ VMs in an **availability set** | 99.95% |
| Single VM, all **Premium SSD/Ultra** disks | 99.9% |

- Availability set: **fault domains** (racks, 2–3) + **update domains** (maintenance groups, up to 20, default 5). **Creation-time only** — to add an existing VM, recreate it (keep disks/NIC). Same for zones.
- VMSS vs availability set: scale sets add autoscaling + uniform management.

### Disks
- Types: Standard HDD < Standard SSD < **Premium SSD** < Premium SSD v2 < **Ultra** (configurable IOPS/throughput, most demanding workloads).
- Managed disks always; OS disk + data disks + **temp disk** (ephemeral — lost on deallocate/redeploy; never store data there).
- Snapshots = point-in-time copy of a disk; images = generalized template for new VMs (Sysprep for Windows → **Azure Compute Gallery** for sharing).

### Encryption
- **SSE** (platform, always on) vs **ADE** (in-guest BitLocker/dm-crypt; needs **Key Vault same region+subscription**, enabled-for-disk-encryption) vs **Encryption at host** (hypervisor-level, agentless, covers temp/cache; enable subscription feature first).

### Operations
- **Resize:** same cluster = live; different hardware family = **deallocate first**; in an availability set possibly **stop ALL VMs** in the set.
- **Move:** RG/subscription = supported (IDs change, region stays). **Region move = Azure Resource Mover / Site Recovery.**
- Dynamic public IP released on deallocate; **static** survives.
- Redeploy (new host) / reapply = first-line fixes for stuck VMs.
- Run Command / Serial console / Boot diagnostics for troubleshooting access.
- `az vm create -g RG -n VM1 --image Ubuntu2204 --generate-ssh-keys`
- Spot VMs: cheap, **evictable** when Azure needs capacity.

## 3. VM Scale Sets

- **Orchestration:** **Uniform** (identical instances) vs **Flexible** (mix sizes + manual VMs, better fault spreading).
- **Autoscale:** min/max/default counts; scale-out and scale-in rules (CPU, memory, queue depth, schedule). Cap always respected. Cooldown prevents flapping.
- Upgrade policy: automatic / rolling / manual.

## 4. Containers

### ACR (registry)
- SKUs: Basic / Standard / **Premium** (geo-replication, private link, content trust).
- `az acr build` = cloud build + push (no local Docker). ACR Tasks = CI on base-image updates.
- Pull without credentials: **managed identity + AcrPull** role. Admin account = discouraged.

### ACI (instances)
- Serverless, per-second billing, fast start. **Container group** = shared host/lifecycle/localhost/volumes (≈ pod); **multi-container groups are Linux-only**.
- Restart policy: Always (service) / OnFailure / Never (batch).
- Mount **Azure Files** shares as volumes. Can join a VNet.

### Container Apps
- Built on AKS + **KEDA** (scale to zero, event-driven) + Dapr. **Revisions** + traffic splitting. Choose when you need autoscaling/microservice features without managing Kubernetes.

### Pick-the-service heuristics
- One quick container, minimal management → **ACI**
- Autoscale/scale-to-zero/microservices, no K8s admin → **Container Apps**
- Full Kubernetes control → AKS (barely on AZ-104)

## 5. App Service

- **Plan** = region + compute size; all apps in a plan share instances. Tiers: Free/Shared (dev) → **Basic** (custom domain+SSL, manual scale) → **Standard** (autoscale, **5 slots**, backups) → **Premium** (more slots/scale, VNet features) → Isolated (ASE).
- **Scale up** = tier/size; **scale out** = instances. **Autoscale = Standard+**.
- **Deployment slots** (Standard+): deploy to staging → **swap** (pre-warmed, no downtime, instant rollback). Settings marked **"Deployment slot setting"** are sticky to the slot (e.g. prod connection string).
- **Custom domain:** CNAME `www → app.azurewebsites.net` + TXT `asuid` verification (apex: A record + TXT). Then add **TLS binding**.
- **Managed certificate (free):** auto-renew, **no wildcard**, not exportable, Basic+.
- **Networking:** inbound restrictions = **Access restrictions** (IP rules); inbound private = **private endpoint**; outbound into your VNet = **regional VNet integration**; hybrid connections for single on-prem endpoints.
- **Backup** (Standard+): scheduled, to a storage account.
- Always On: keeps app warm (needed for continuous WebJobs).

---

## ⚡ Rapid-fire traps
1. Complete mode deletes what's not in the template.
2. Availability set/zone membership = creation time only.
3. 99.99% needs zones; 99.95% availability set; 99.9% single VM premium disks.
4. Resize to other hardware = deallocate (whole set if in availability set).
5. Temp disk data is lost on deallocate.
6. ADE Key Vault must be same region + subscription.
7. Geo-replication of ACR = Premium.
8. Multi-container ACI group = Linux only.
9. Slots & backups = Standard+; autoscale = Standard+; manual scale = Basic.
10. Slot-sticky settings don't swap.

📎 [Template docs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/) · [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview) · [VM availability](https://learn.microsoft.com/en-us/azure/virtual-machines/availability) · [Disk types](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types) · [VMSS](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview) · [ACR](https://learn.microsoft.com/en-us/azure/container-registry/) · [ACI](https://learn.microsoft.com/en-us/azure/container-instances/) · [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/) · [App Service](https://learn.microsoft.com/en-us/azure/app-service/)
