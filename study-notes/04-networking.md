# Study Notes — Domain 4: Implement and Manage Virtual Networking (15–20%)

Exam-focused cheat sheet. Pair with `question-bank/04-networking.md`.

---

## 1. VNets & subnets

- VNet = regional (spans all AZs of one region). Address space in CIDR; add prefixes later if needed; **no overlap** with networks you'll connect (peering/VPN).
- **5 reserved IPs per subnet** (.0 network, .1 gateway, .2–.3 Azure DNS, broadcast). /27 = 32−5 = **27 usable**. First usable host = **.4**.
- Named dedicated subnets: **GatewaySubnet** (VPN/ER gateway), **AzureBastionSubnet** (**/26 minimum**), AzureFirewallSubnet.
- One route table and one NSG per subnet (an NSG can serve many subnets).
- Azure-provided DNS (168.63.129.16) resolves names within a VNet automatically; cross-VNet → private DNS zones or custom DNS servers (set at VNet level, override per NIC).

## 2. Peering

- Connects two VNets over the Microsoft backbone (no gateway, no internet). **Regional** or **Global** (cross-region).
- **Non-transitive**: A↔B, B↔C does NOT give A↔C. Hub-spoke needs NVA routing (+ **Allow forwarded traffic**) or direct peering.
- **No overlapping address spaces.** Cross-subscription and cross-tenant supported. Both sides must show **Connected**.
- **Gateway transit:** hub "Allow gateway transit" + spoke "Use remote gateways" → spokes use hub's VPN/ER gateway. Only one side may have a gateway in that relationship.

## 3. IP addresses & routing

- **Standard public IP** (Basic is retired): **static**, secure-by-default (needs NSG), zone-redundant option. SKU must match the load balancer's SKU.
- Private IPs: dynamic (default) or static; dynamic public IP is released on VM deallocate.
- **Route precedence** for the same prefix: **UDR > BGP > system**; across prefixes: longest match wins.
- UDR next-hop types: **Virtual appliance** (give NVA's IP), Virtual network gateway, VNet, Internet, **None** (blackhole/drop).
- Force traffic through firewall: UDR `0.0.0.0/0 → Virtual appliance <NVA IP>` on each subnet.
- Verify with NIC **Effective routes**.

## 4. NSGs & ASGs

- Rules: priority **100–4096**, **lowest number first, first match wins**. Default rules (65000+): AllowVnetInBound, AllowAzureLoadBalancerInBound, DenyAllInBound (and outbound equivalents).
- **Stateful**: allowed inbound flow's replies are auto-allowed outbound (and vice versa).
- Evaluation with NSG on subnet AND NIC — **inbound: subnet → NIC; outbound: NIC → subnet; BOTH must allow.**
- **Service tags**: Microsoft-managed prefix groups (Internet, VirtualNetwork, Storage, Sql, AzureLoadBalancer...).
- **ASGs**: group NICs by role (web/app/db) and use in rules instead of IPs. All NICs referenced by ASGs in one rule must be in the **same VNet**.
- Diagnose: **Effective security rules** (merged view) · **IP flow verify** (is this 5-tuple allowed, and by which rule?).

## 5. Bastion

- Browser RDP/SSH over **TLS 443** through the portal; VMs need **no public IPs**, no RDP exposure to internet.
- Needs **AzureBastionSubnet ≥ /26** + Standard public IP. 
- **Standard SKU** extras: native client (`az network bastion rdp/ssh`), shareable links, connect by IP, scaling.

## 6. Service endpoints vs Private endpoints (top exam topic)

| | Service endpoint | Private endpoint |
|---|---|---|
| What | Subnet identity presented to PaaS over backbone | **NIC with private IP** in your VNet for one PaaS resource |
| PaaS endpoint | still **public** | private (public can be disabled) |
| From on-premises | ✘ | ✔ (via VPN/ER) |
| DNS work | none | **privatelink.* private DNS zone** + VNet link |
| Cost | free | per-hour + data |

- Private endpoint DNS: `contoso1.blob.core.windows.net` → CNAME → `contoso1.privatelink.blob.core.windows.net` → A record (private IP) in the private zone.

## 7. Azure DNS

- **Public zones:** host your domain; delegate by setting the registrar's **NS records** to the 4 Azure DNS name servers. Azure DNS is **not a registrar**.
- Record sets: A/AAAA/CNAME/MX/TXT/NS/SOA/SRV/PTR. **CNAME illegal at apex** → use **alias record** (points to Azure public IP/Traffic Manager, auto-tracks changes).
- **Private zones:** name resolution inside linked VNets. **VNet links**: resolution (up to 1000) vs **auto-registration** (up to 100; VM A-records auto-managed).

## 8. Load balancing

### Azure Load Balancer (Layer 4, TCP/UDP)
- **Standard SKU**: 99.99% SLA, zones, secure by default (**NSG required to admit traffic** — classic "no traffic reaches backend" cause), matches Standard public IP. Basic = retired.
- Components: frontend IP, backend pool, **health probe** (TCP/HTTP/HTTPS; failed probe = no NEW connections), load-balancing rules.
- Distribution: default **5-tuple hash** (no persistence); **Client IP (±protocol)** = session persistence/affinity.
- **Inbound NAT rule** = port-forward frontend:port → specific VM (RDP to one VM behind LB).
- **HA ports** (all ports/protocols): **internal Standard LB only**, for NVA clusters.
- **Internal LB** = private frontend IP (VNet-only consumers).
- Outbound: outbound rules / NAT Gateway for SNAT.

### Layer 7 & picking the right balancer
- **Application Gateway**: HTTP(S), path/host-based routing, TLS termination, **WAF**, cookie session affinity. Regional.
- Keywords: "URL path routing / WAF / TLS offload" → App Gateway. "TCP/UDP, non-HTTP, port forwarding" → Load Balancer. (Traffic Manager = DNS-global, Front Door = global HTTP — rarely deep on AZ-104.)

## 9. Troubleshooting flow (exam logic)

1. NSG blocking? → **IP flow verify** / Effective security rules
2. Wrong route? → **Next hop** / Effective routes
3. LB not forwarding? → health probe status + NSG allows traffic + SKU match
4. Name resolution? → DNS settings (VNet custom DNS, private zone links)
5. Peering? → state Connected both sides, no overlap, forwarded traffic/gateway settings

---

## ⚡ Rapid-fire traps
1. 5 IPs reserved per subnet; .4 is first usable.
2. Peering is non-transitive and needs non-overlapping space.
3. UDR beats BGP beats system routes.
4. Inbound = subnet NSG then NIC NSG — both must allow.
5. NSG priority: lower number wins; evaluation stops at first match (an allow at 150 beats a deny at 200).
6. Standard LB/IP = secure by default: no NSG allow = no traffic.
7. Service endpoint ≠ works from on-prem; private endpoint does.
8. Private endpoint needs privatelink DNS zone.
9. Bastion: AzureBastionSubnet /26+, TLS 443, no VM public IPs.
10. Apex record to Azure IP = alias record, not CNAME.

📎 [VNet](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview) · [Peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview) · [NSG](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview) · [UDR](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview) · [Bastion](https://learn.microsoft.com/en-us/azure/bastion/bastion-overview) · [Private Link](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview) · [Azure DNS](https://learn.microsoft.com/en-us/azure/dns/dns-overview) · [Load Balancer](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview)
