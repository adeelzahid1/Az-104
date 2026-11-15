# Domain 4 — Implement and Manage Virtual Networking (15–20%)

50 questions · Answer key at the bottom — attempt first!
Subtopics: VNets, subnets, peering, public IPs, routes · NSGs/ASGs, Bastion, service & private endpoints · Azure DNS, load balancing

---

## Section A — VNets, subnets, peering, IPs, routing (Q1–Q18)

### Q1 [MCQ | Easy | Subnets]
In every Azure subnet, how many IP addresses are reserved and unusable?
- A. 2
- B. 3
- C. 5
- D. 10

### Q2 [MCQ | Medium | Subnets]
A subnet is defined as 10.1.1.0/27. How many usable IPs are available for resources?
- A. 32
- B. 30
- C. 27
- D. 29

### Q3 [MCQ | Easy | VNets]
Two VNets — 10.0.0.0/16 and 10.0.0.0/16 — need to be peered. What is the problem?
- A. Nothing; peering will work
- B. Peering requires non-overlapping address spaces; these overlap completely
- C. Peering only works across regions
- D. /16 is too large to peer

### Q4 [MCQ | Medium | Peering]
VNet-A is peered with VNet-B. VNet-B is peered with VNet-C. Can a VM in VNet-A reach a VM in VNet-C through these peerings alone?
- A. Yes, automatically
- B. No — peering is non-transitive; you need A–C peering or routing through an NVA/gateway
- C. Yes if in the same region
- D. Only with Basic load balancer

### Q5 [MCQ | Medium | Peering]
Which peering settings allow spoke VNets to use a VPN gateway located in the hub VNet?
- A. Hub: Allow gateway transit · Spoke: Use remote gateways
- B. Both sides: Allow forwarded traffic only
- C. Hub: Use remote gateways · Spoke: Allow gateway transit
- D. No settings needed

### Q6 [MCQ | Easy | Peering]
Global VNet peering connects:
- A. VNets in the same region only
- B. VNets across different Azure regions
- C. VNets to on-premises
- D. Two subscriptions only if in same tenant

### Q7 [MCQ | Medium | Public IP]
Which statements describe a Standard SKU public IP? (best single answer)
- A. Dynamic by default, open by default
- B. Static allocation, secure by default (requires NSG to allow traffic), zone-redundancy support
- C. Free and dynamic
- D. IPv6 only

### Q8 [MCQ | Hard | Routing]
For a given destination, a subnet's effective route table contains a system route, a BGP route, and a user-defined route with the same prefix. Which wins?
- A. System route
- B. BGP route
- C. User-defined route
- D. The oldest route

### Q9 [MCQ | Medium | Routing]
All outbound internet traffic from SubnetA must pass through a firewall NVA at 10.0.100.4. Which UDR do you create on SubnetA's route table?
- A. 0.0.0.0/0 → next hop Internet
- B. 0.0.0.0/0 → next hop Virtual appliance (10.0.100.4)
- C. 10.0.100.4/32 → next hop VNet
- D. 0.0.0.0/0 → next hop None

### Q10 [MCQ | Medium | Routing]
The next hop type "None" in a route does what?
- A. Uses default routing
- B. Drops the traffic (blackhole)
- C. Sends to internet
- D. Sends to the VNet gateway

### Q11 [MCQ | Easy | IP addressing]
A VM needs an IP that never changes, used in firewall rules of a partner. Configure:
- A. Dynamic private IP
- B. Static public IP (Standard SKU)
- C. Any public IP — they never change
- D. A DNS CNAME

### Q12 [MCQ | Hard | Troubleshooting]
VM1 cannot reach VM2 in a peered VNet. You suspect a route problem. Which Network Watcher / NIC feature shows the ACTUAL routes applied to VM1's NIC?
- A. IP flow verify
- B. Effective routes
- C. Topology
- D. Packet capture

### Q13 [MCQ | Medium | DNS in VNets]
VMs in a VNet must resolve each other by hostname using Azure-provided DNS. This works:
- A. Only with a custom DNS server
- B. Automatically within the same VNet via Azure-provided name resolution (168.63.129.16)
- C. Never
- D. Only with public DNS zones

### Q14 [MULTI | Medium | Peering] (Choose 2)
Which TWO are true about VNet peering?
- A. Traffic between peered VNets traverses the Microsoft backbone, not the public internet
- B. Peering state must be "Connected" on both sides to work
- C. Peered VNets automatically share DNS settings
- D. Peering encrypts all traffic with IPsec

### Q15 [MCQ | Medium | Subnets]
Which resources require their own DEDICATED subnet with a specific name? (best single answer)
- A. VMs
- B. Azure Bastion (AzureBastionSubnet) and VPN Gateway (GatewaySubnet)
- C. Storage accounts
- D. NSGs

### Q16 [MCQ | Easy | VNets]
A VNet spans:
- A. Multiple regions
- B. A single region (but all availability zones within it)
- C. One datacenter only
- D. One subscription max 1 VNet

### Q17 [YESNO | Hard | Networking core]
Answer Yes or No:
1. You can resize a VNet's address space (add prefixes) after creation.
2. A subnet can be associated with more than one route table.
3. Peering two VNets in different subscriptions (same or different tenants) is supported.
4. The first VM deployed into a subnet can take the x.x.x.1 address.

### Q18 [ORDER | Medium | Hub-spoke]
Order the steps to let Spoke1 VMs reach on-premises through the hub's VPN gateway:
1. Create VNet peering Hub↔Spoke1
2. Enable "Allow gateway transit" on hub side of the peering
3. Enable "Use remote gateways" on Spoke1 side
4. Verify effective routes on a Spoke1 VM show the on-prem prefixes

---

## Section B — NSGs, ASGs, Bastion, endpoints (Q19–Q35)

### Q19 [MCQ | Easy | NSG]
NSG rules are processed:
- A. Alphabetically
- B. In priority order, lowest number first; processing stops at the first match
- C. Randomly
- D. Highest number first

### Q20 [MCQ | Medium | NSG]
For INBOUND traffic to a VM with an NSG on both the subnet and the NIC, the evaluation order is:
- A. NIC NSG first, then subnet NSG
- B. Subnet NSG first, then NIC NSG — traffic must be allowed by BOTH
- C. Only the NIC NSG applies
- D. Whichever has lower priorities

### Q21 [MCQ | Medium | NSG]
Which default NSG rule allows VMs in a VNet to talk to each other even with no custom rules?
- A. AllowInternetInBound
- B. AllowVnetInBound (priority 65000)
- C. DenyAllInBound
- D. AllowRDP

### Q22 [MCQ | Hard | NSG]
You create an inbound DENY rule priority 200 for port 3389 and an ALLOW rule priority 150 for 3389 from your office IP. From the office, RDP will:
- A. Be blocked — deny always wins
- B. Work — priority 150 allow matches first and processing stops
- C. Work only after reboot
- D. Fail — office IPs can't be whitelisted

### Q23 [MCQ | Medium | NSG]
NSGs are stateful. This means:
- A. You must create matching outbound rules for every inbound allow
- B. Return traffic for an allowed connection is automatically permitted — no reverse rule needed
- C. They remember rules after deletion
- D. Each rule applies once per day

### Q24 [MCQ | Easy | ASG]
Application security groups (ASGs) let you:
- A. Encrypt traffic between apps
- B. Group VMs (NICs) by role and use those groups as source/destination in NSG rules instead of IPs
- C. Replace NSGs entirely
- D. Scale applications

### Q25 [MCQ | Hard | ASG]
Constraint on using TWO ASGs in a single NSG rule (as source and destination):
- A. Never allowed
- B. All NICs referenced by both ASGs must be in the SAME virtual network
- C. ASGs must be in different regions
- D. Requires Premium SKU

### Q26 [MCQ | Medium | Service tags]
In an NSG rule, the service tag "Internet" versus "VirtualNetwork": which statement is true?
- A. Service tags are deprecated
- B. Service tags represent Microsoft-managed groups of IP prefixes (e.g. Storage, AzureLoadBalancer) usable instead of IP ranges
- C. Tags only work in Azure Firewall
- D. You must update tag IPs manually

### Q27 [MCQ | Easy | Bastion]
Azure Bastion provides:
- A. VPN access to VNets
- B. Browser-based (portal) RDP/SSH to VMs over TLS 443 without public IPs on the VMs
- C. A web application firewall
- D. DNS resolution

### Q28 [MCQ | Medium | Bastion]
Requirements for deploying Azure Bastion in a VNet include:
- A. A subnet named AzureBastionSubnet of at least /26, plus a public IP (Standard) for Bastion
- B. Any subnet name, /29 is fine
- C. Public IPs on all target VMs
- D. An ExpressRoute circuit

### Q29 [MCQ | Hard | Bastion]
Which capability requires the Bastion Standard SKU (not Basic)?
- A. RDP via browser
- B. Native client support (az network bastion rdp / tunneling), shareable links, IP-based connection
- C. SSH via browser
- D. Connecting to one VM

### Q30 [MCQ | Medium | Service endpoints]
When you enable a service endpoint for Microsoft.Storage on a subnet:
- A. The storage account gets a private IP in the subnet
- B. Traffic to Azure Storage from that subnet uses the Azure backbone and presents the subnet's identity, allowing the storage firewall to allow that subnet — but the service keeps its PUBLIC endpoint
- C. All internet access is blocked
- D. Storage becomes publicly readable

### Q31 [MCQ | Medium | Private endpoints]
The key difference between a private endpoint and a service endpoint:
- A. No difference
- B. A private endpoint creates a NIC with a private IP in YOUR VNet for the PaaS resource; traffic goes to that private IP — usable from on-premises via VPN too
- C. Private endpoints are free; service endpoints cost money
- D. Service endpoints work from on-premises

### Q32 [MCQ | Hard | Private endpoints]
After creating a private endpoint for storage account "contoso1" (blob), clients inside the VNet must resolve contoso1.blob.core.windows.net to the private IP. The standard solution is:
- A. Edit every client's hosts file
- B. A private DNS zone privatelink.blob.core.windows.net linked to the VNet, with the A record for the endpoint
- C. A public DNS CNAME
- D. Nothing — automatic in all cases

### Q33 [MCQ | Medium | Effective rules]
A VM can't receive traffic on port 8080 and multiple NSGs are involved. The fastest diagnostic view listing ALL rules actually applied to the VM's NIC is:
- A. Azure Advisor
- B. Effective security rules (NIC/Network Watcher)
- C. Activity log
- D. Service Health

### Q34 [MCQ | Medium | IP flow verify]
Network Watcher IP flow verify tells you:
- A. The bandwidth of a link
- B. Whether a specific 5-tuple flow to/from a VM is allowed or denied, and WHICH NSG rule caused it
- C. DNS resolution results
- D. The cost of traffic

### Q35 [YESNO | Medium | Security]
Answer Yes or No:
1. An NSG can be associated with multiple subnets.
2. Deleting an allow rule breaks existing active sessions immediately in all cases.
3. NSGs can filter traffic by service tags and ASGs.
4. Azure Bastion requires an NSG rule allowing RDP from the internet to the target VM.

---

## Section C — DNS and load balancing (Q36–Q50)

### Q36 [MCQ | Easy | Azure DNS]
You bought contoso.com from a registrar and want Azure DNS to host the zone. What do you configure at the registrar?
- A. A records pointing to Azure
- B. The NS records of the domain, set to the four Azure DNS name servers of your zone
- C. MX records
- D. Nothing

### Q37 [MCQ | Medium | Azure DNS]
Azure DNS public zones can NOT do which of the following?
- A. Host A/AAAA/CNAME/TXT/MX records
- B. Act as a domain registrar (buy domains)
- C. Alias records to Azure public IPs
- D. Support TXT verification records

### Q38 [MCQ | Medium | Private DNS]
A private DNS zone with auto-registration enabled on a VNet link does what?
- A. Registers on-premises servers
- B. Automatically creates and updates A records for VMs deployed in the linked VNet
- C. Issues TLS certificates
- D. Blocks public DNS

### Q39 [MCQ | Hard | Private DNS]
How many virtual networks can have AUTO-REGISTRATION enabled vs just RESOLUTION for one private DNS zone? (concept)
- A. Registration and resolution unlimited
- B. Registration links are limited (e.g. 100) and resolution links have a higher limit (e.g. 1000) — registration is the scarcer link type
- C. One VNet total
- D. Registration = 1000, resolution = 100

### Q40 [MCQ | Medium | Alias records]
An alias record set in Azure DNS is useful because:
- A. It's cheaper
- B. It can point the zone APEX (contoso.com) to an Azure resource like a public IP, and auto-updates if the IP changes
- C. It replaces CNAMEs everywhere
- D. It works cross-provider

### Q41 [MCQ | Easy | Load balancer]
Azure Load Balancer operates at which OSI layer?
- A. Layer 7 (HTTP)
- B. Layer 4 (TCP/UDP)
- C. Layer 3 only
- D. Layer 2

### Q42 [MCQ | Medium | Load balancer]
Which load balancer SKU is required for availability zone support and an SLA, and what rule applies to its public IP?
- A. Basic; any IP
- B. Standard; the public IP must also be Standard SKU
- C. Premium; Basic IP
- D. Gateway; no IP

### Q43 [MCQ | Medium | Load balancer]
A health probe fails for a backend VM. The Standard load balancer will:
- A. Delete the VM
- B. Stop sending NEW connections to that VM until the probe succeeds again
- C. Restart the VM
- D. Alert the owner by email automatically

### Q44 [MCQ | Hard | Load balancer]
Users must always land on the SAME backend VM for the duration of their session (e.g., legacy app keeping local session state). Configure:
- A. Floating IP
- B. Session persistence: Client IP (or Client IP and protocol) distribution mode
- C. HA ports
- D. More probes

### Q45 [MCQ | Medium | Load balancer]
An INTERNAL Standard load balancer differs from a public one because it:
- A. Uses a private frontend IP from a VNet subnet and is reachable only inside the network (VNet/VPN/peering)
- B. Is Layer 7
- C. Cannot have health probes
- D. Requires Basic SKU

### Q46 [MCQ | Hard | Load balancer]
HA ports rule (frontendPort=0, backendPort=0, protocol All) is used for and available on:
- A. Web apps; public LB
- B. Load balancing ALL ports/protocols — typically for NVA clusters; INTERNAL Standard LB only
- C. DNS servers; Basic LB
- D. Port mirroring; any LB

### Q47 [MCQ | Medium | Inbound NAT]
To RDP to a specific VM behind a load balancer's single public IP (e.g., port 50001 → VM1:3389), configure:
- A. A load balancing rule
- B. An inbound NAT rule
- C. An outbound rule
- D. A UDR

### Q48 [MCQ | Medium | Choice of service]
Requirement: route HTTP requests by URL path (/images → pool1, /video → pool2) with TLS termination and WAF. Azure Load Balancer is wrong because:
- A. It can't scale
- B. Path-based routing/TLS/WAF are Layer-7 features — use Application Gateway (with WAF) instead
- C. It's too expensive
- D. It can't do health probes

### Q49 [MCQ | Hard | Troubleshoot LB]
Backend VMs behind a new Standard public LB receive no traffic. VMs are healthy, rules look right. A classic cause is:
- A. Too many VMs
- B. No NSG rule allowing the traffic — Standard LB is secure by default, so without an NSG allow (incl. probe source AzureLoadBalancer), traffic is dropped
- C. The LB needs a restart
- D. Port 445 blocked by ISP

### Q50 [SCENARIO | Hard | Networking mixed]
Hub VNet (10.0.0.0/16) hosts a firewall NVA (10.0.1.4) and VPN gateway. Spokes VNet-App (10.1.0.0/16) and VNet-Db (10.2.0.0/16) are peered to the hub only. Requirements: App VMs reach Db VMs through the firewall; on-premises users reach App via VPN; Db storage traffic must use a private IP.
1. Why can't App reach Db directly today, and what routing makes App→Db go via the NVA?
2. Which peering options enable on-prem → App through the hub gateway?
3. What gives the storage account a private IP for Db?
4. Which Network Watcher tool confirms the App→Db next hop is the NVA?

---
---

# 🔑 Answer Key — Domain 4

**Q1 — C.** 5 per subnet: network, broadcast, default gateway, and 2 Azure DNS addresses. 📎 [VNet FAQ](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq)

**Q2 — C.** /27 = 32 addresses − 5 reserved = 27 usable. 📎 same.

**Q3 — B.** Overlapping address spaces cannot be peered. 📎 [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)

**Q4 — B.** Peering is non-transitive — hub-spoke needs an NVA/gateway or direct peering. 📎 same.

**Q5 — A.** Hub advertises its gateway (Allow gateway transit); spoke consumes it (Use remote gateways). 📎 [Gateway transit](https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-peering-gateway-transit)

**Q6 — B.** Global peering = cross-region. 📎 [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)

**Q7 — B.** Standard public IP: static, secure-by-default, zone-redundant capable. (Basic SKU is retired — Sept 2025.) 📎 [Public IPs](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses)

**Q8 — C.** Same-prefix precedence: UDR > BGP > system. (Longest prefix match comes first across different prefixes.) 📎 [Routing](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview)

**Q9 — B.** Default route 0.0.0.0/0 → Virtual appliance with the NVA's IP. 📎 same.

**Q10 — B.** None = drop (blackhole). 📎 same.

**Q11 — B.** Static public IP never changes across deallocation. 📎 [Public IPs](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses)

**Q12 — B.** Effective routes shows the merged system+BGP+UDR routes actually applied. A ✗ IP flow verify tests NSG rules. 📎 [Effective routes](https://learn.microsoft.com/en-us/azure/virtual-network/diagnose-network-routing-problem)

**Q13 — B.** Azure-provided DNS (168.63.129.16) resolves hostnames within a VNet automatically. Cross-VNet needs private DNS zones or custom DNS. 📎 [Name resolution](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-name-resolution-for-vms-and-role-instances)

**Q14 — A and B.** Backbone traffic + both sides Connected. C ✗ DNS isn't shared; D ✗ no automatic IPsec. 📎 [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)

**Q15 — B.** AzureBastionSubnet and GatewaySubnet are named, dedicated subnets. 📎 [Bastion config](https://learn.microsoft.com/en-us/azure/bastion/configuration-settings)

**Q16 — B.** A VNet is regional; it spans all AZs of its region. 📎 [VNet overview](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview)

**Q17 — 1 Yes** (add address space; peered VNets may need re-sync). **2 No** (one route table per subnet). **3 Yes** (cross-subscription and cross-tenant peering supported). **4 No** (x.x.x.1–3 are reserved; first usable is .4). 📎 [VNet FAQ](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq)

**Q18 — Order: 1 → 2 → 3 → 4.** Peer, enable transit on hub, use remote gateways on spoke, verify effective routes. 📎 [Gateway transit](https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-peering-gateway-transit)

**Q19 — B.** Lowest priority number first; first match wins. 📎 [NSG overview](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)

**Q20 — B.** Inbound: subnet NSG → NIC NSG (both must allow). Outbound: NIC → subnet. 📎 same.

**Q21 — B.** AllowVnetInBound (65000) permits intra-VNet traffic by default. 📎 same.

**Q22 — B.** 150 < 200, allow matches first, evaluation stops. Deny does NOT globally override — priority order decides. 📎 same.

**Q23 — B.** Stateful = return traffic auto-allowed for established flows. 📎 same.

**Q24 — B.** ASGs = logical app-role grouping of NICs for NSG rules. 📎 [ASGs](https://learn.microsoft.com/en-us/azure/virtual-network/application-security-groups)

**Q25 — B.** All NICs in ASGs used by one rule must exist in the same VNet. 📎 same.

**Q26 — B.** Service tags = Microsoft-maintained prefix groups (Storage, Sql, AzureLoadBalancer, Internet…). 📎 [Service tags](https://learn.microsoft.com/en-us/azure/virtual-network/service-tags-overview)

**Q27 — B.** Bastion = TLS 443 browser RDP/SSH, no public IPs on VMs. 📎 [Bastion overview](https://learn.microsoft.com/en-us/azure/bastion/bastion-overview)

**Q28 — A.** AzureBastionSubnet (≥/26) + Standard public IP. 📎 [Bastion config](https://learn.microsoft.com/en-us/azure/bastion/configuration-settings)

**Q29 — B.** Standard adds native client, shareable links, IP-based connections, more instances. 📎 same.

**Q30 — B.** Service endpoint = backbone path + subnet identity to the service's PUBLIC endpoint; no private IP. 📎 [Service endpoints](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview)

**Q31 — B.** Private endpoint = private IP NIC in your VNet; reachable from peered VNets and on-premises. Service endpoints do NOT work from on-premises. 📎 [Private endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)

**Q32 — B.** privatelink.* private DNS zone + VNet link; Azure creates the A record when integrated. 📎 [Private endpoint DNS](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns)

**Q33 — B.** Effective security rules merges subnet+NIC NSGs into the final applied list. 📎 [Effective security rules](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-security-group-view-overview)

**Q34 — B.** IP flow verify: allowed/denied + the rule responsible. 📎 [IP flow verify](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-ip-flow-verify-overview)

**Q35 — 1 Yes. 2 No** (established flows may continue; interrupting flows isn't guaranteed immediate — new flows are blocked). **3 Yes. 4 No** (Bastion connects over the VNet privately; VMs need no internet-facing RDP rule — allow from the Bastion subnet/VirtualNetwork instead). 📎 [Bastion FAQ](https://learn.microsoft.com/en-us/azure/bastion/bastion-faq)

**Q36 — B.** Delegate the domain: set registrar NS records to the zone's four Azure DNS name servers. 📎 [Delegate domain](https://learn.microsoft.com/en-us/azure/dns/dns-delegate-domain-azure-dns)

**Q37 — B.** Azure DNS hosts zones; it does not sell/register domains (App Service Domains does that). 📎 [Azure DNS overview](https://learn.microsoft.com/en-us/azure/dns/dns-overview)

**Q38 — B.** Auto-registration maintains A records for VMs in the linked VNet. 📎 [Private DNS zones](https://learn.microsoft.com/en-us/azure/dns/private-dns-overview)

**Q39 — B.** Registration links are the scarcer resource (100 registration vs 1000 resolution links per zone). 📎 [Private DNS limits](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-dns-limits)

**Q40 — B.** Alias records: apex can target Azure resources and track IP changes (CNAME is illegal at apex). 📎 [Alias records](https://learn.microsoft.com/en-us/azure/dns/dns-alias)

**Q41 — B.** Layer 4 TCP/UDP. 📎 [LB overview](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview)

**Q42 — B.** Standard LB: zones + 99.99% SLA; SKUs of LB and public IP must match. 📎 [LB SKUs](https://learn.microsoft.com/en-us/azure/load-balancer/skus)

**Q43 — B.** Probe-down removes the instance from NEW flow distribution. 📎 [Health probes](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-custom-probe-overview)

**Q44 — B.** Source IP affinity ("Client IP" / "Client IP and protocol") pins a client to one backend. Default is 5-tuple hash (no persistence). 📎 [Distribution modes](https://learn.microsoft.com/en-us/azure/load-balancer/distribution-mode-concepts)

**Q45 — A.** Internal LB = private frontend, internal consumers only. 📎 [Internal LB](https://learn.microsoft.com/en-us/azure/load-balancer/components)

**Q46 — B.** HA ports: all ports/protocols, internal Standard LB, NVA scenarios. 📎 [HA ports](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-ha-ports-overview)

**Q47 — B.** Inbound NAT rule = port-forward a frontend port to one VM's port. 📎 [Inbound NAT](https://learn.microsoft.com/en-us/azure/load-balancer/inbound-nat-rules)

**Q48 — B.** URL routing, TLS termination, WAF = Layer 7 = Application Gateway. 📎 [App Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/overview)

**Q49 — B.** Standard LB is secure by default — an NSG must allow the app port (and the AzureLoadBalancer probe tag is allowed by default rule 65001). 📎 [LB SKUs](https://learn.microsoft.com/en-us/azure/load-balancer/skus)

**Q50 — 1:** Spokes are peered to hub only; peering is non-transitive. Add UDRs on each spoke subnet (e.g. 10.2.0.0/16 → Virtual appliance 10.0.1.4 on App side, and the mirror on Db side) and enable Allow forwarded traffic on the peerings. **2:** Hub: Allow gateway transit; Spoke-App: Use remote gateways. **3:** A private endpoint for the storage account in VNet-Db (+ privatelink DNS zone). **4:** Next hop (Network Watcher) — confirms the next hop for App→Db is 10.0.1.4. 📎 [Routing](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview) · [Next hop](https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-next-hop-overview)
