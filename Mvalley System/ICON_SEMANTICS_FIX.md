# Sidebar Icon Semantics Fix

## Mapping Table

| Sidebar Item | Old Icon | Old Icon Meaning | New Icon | New Icon Meaning |
|--------------|----------|------------------|----------|------------------|
| **CRM** (Main Section) | `FiPhone` | Phone / calling | `FiGitBranch` | Flow / connections / funnel |
| **Finance → Reconciliation** | `FiCheckCircle` | Checkmark (done/approved) | `FiRefreshCw` | Sync / two-way comparison |
| **HR** (Main Section) | `FiUsers` | Single person / people list | `FiBriefcase` | Workforce / resources / systems |
| **Marketing → Campaigns** | `FiTrendingUp` | Growth / analytics | `FiTarget` | Target / objective / intent |
| **Marketing → Channels** | `FiLink` | Generic link | `FiRadio` | Broadcast / signal / platform |

---

## Icon Choices & Rationale

### 1. CRM: `FiGitBranch` (replaces `FiPhone`)

**Why:** `FiGitBranch` represents flow, branching paths, and relationship connections. CRM is about managing the journey from lead → conversion across multiple touchpoints, not just phone calls. This icon scales correctly when WhatsApp, email, and other channels are added, as it represents the system of relationships rather than a single communication method.

---

### 2. Finance → Reconciliation: `FiRefreshCw` (replaces `FiCheckCircle`)

**Why:** `FiRefreshCw` (circular arrows) represents an active comparison and synchronization process. Reconciliation is about matching expected vs. actual, not a completed state. The two-way circular motion visually communicates the back-and-forth validation process that reconciliation requires.

---

### 3. HR: `FiBriefcase` (replaces `FiUsers`)

**Why:** `FiBriefcase` represents workforce management, organizational resources, and human resource systems. HR is about managing capacity, availability, and workforce systems—not just listing people. This icon correctly communicates that HR is a management function, not a directory.

---

### 4. Marketing → Campaigns: `FiTarget` (replaces `FiTrendingUp`)

**Why:** `FiTarget` represents intentional targeting, objectives, and conversion initiatives. Campaigns are about directed efforts with specific goals, not just growth metrics. This icon communicates purpose and intent, which is the core of campaign management.

---

### 5. Marketing → Channels: `FiRadio` (replaces `FiLink`)

**Why:** `FiRadio` represents broadcast, signal transmission, and communication platforms. Channels are inbound/outbound communication sources (WhatsApp, Facebook, Instagram, etc.), not just links. This icon correctly communicates that channels are active communication platforms, not passive connections.

---

## Success Criteria Met

✅ Icons clearly describe system purpose, not data objects  
✅ No icon will become misleading when:
   - WhatsApp is added (CRM uses flow icon, not phone)
   - Automation is enabled (all icons represent processes, not static states)
   - Volume increases (icons represent scalable systems)
✅ Sidebar reads like a real operating system, not a CRUD menu

---

## Technical Details

- **Icon Library:** `react-icons/fi` (Feather Icons - outline/stroke-based)
- **No visual redesign:** Only icon replacements
- **No functional changes:** Navigation structure, labels, roles, and permissions unchanged
- **Build Status:** ✅ Compiled successfully

