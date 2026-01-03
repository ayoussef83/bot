# Icon Library & RAM Optimization Guide

## Icon Library Information

### Current Library
- **Package**: `react-icons` v5.5.0
- **Icon Set**: `react-icons/fi` (Feather Icons)
- **Style**: Outline/stroke-based icons
- **License**: MIT

### How to Find Available Icons

#### Method 1: Official Documentation
Visit: https://react-icons.github.io/react-icons/
- Navigate to the "Feather" (fi) section
- Browse all available icons with live preview
- Copy the exact icon name (e.g., `FiHome`, `FiUsers`)

#### Method 2: TypeScript Autocomplete
In your IDE, when typing `Fi`, you'll get autocomplete suggestions:
```typescript
import { FiHome, FiUsers, FiTarget, ... } from 'react-icons/fi';
```

#### Method 3: Check Installed Package
```bash
cd frontend
ls node_modules/react-icons/fi/  # Lists all icon files
```

### Commonly Used Feather Icons (fi)

**Navigation & Structure:**
- `FiHome`, `FiMenu`, `FiChevronRight`, `FiChevronLeft`, `FiArrowRight`, `FiArrowLeft`

**Users & People:**
- `FiUser`, `FiUsers`, `FiUserCheck`, `FiUserPlus`, `FiUserX`, `FiUserMinus`

**Business & Finance:**
- `FiDollarSign`, `FiCreditCard`, `FiTrendingUp`, `FiTrendingDown`, `FiBarChart2`, `FiPieChart`

**Communication:**
- `FiMail`, `FiMessageSquare`, `FiMessageCircle`, `FiPhone`, `FiVideo`, `FiRadio`

**Files & Documents:**
- `FiFileText`, `FiFile`, `FiFolder`, `FiDownload`, `FiUpload`, `FiSave`

**Actions:**
- `FiPlus`, `FiMinus`, `FiEdit`, `FiTrash2`, `FiCheck`, `FiX`, `FiRefreshCw`, `FiSearch`

**System & Settings:**
- `FiSettings`, `FiSliders`, `FiShield`, `FiLock`, `FiUnlock`, `FiKey`

**Workflow & Flow:**
- `FiGitBranch`, `FiGitMerge`, `FiGitCommit`, `FiActivity`, `FiZap`, `FiTarget`

**Resources & Management:**
- `FiBriefcase`, `FiLayers`, `FiGrid`, `FiPackage`, `FiBox`

**Sync & Comparison:**
- `FiRefreshCw`, `FiRefreshCcw`, `FiRepeat`, `FiRotateCw`, `FiGitCompare`

**Network & Connections:**
- `FiShare2`, `FiLink`, `FiLink2`, `FiWifi`, `FiRadio`, `FiRss`

### Usage Example
```typescript
import { FiTarget, FiRadio, FiGitBranch } from 'react-icons/fi';

// In your component
<FiTarget className="w-4 h-4" />
<FiRadio className="w-4 h-4" />
<FiGitBranch className="w-4 h-4" />
```

---

## RAM Optimization Strategies

### Current Situation
- **System RAM**: 15GB used / ~16GB total
- **Main Consumers**: Cursor IDE (848MB + 719MB), WindowServer (836MB)
- **Load Average**: Very high (13.16, 178.55, 148.38) - indicates system stress

### Optimization Steps

#### 1. **Reduce Cursor/IDE Memory Usage**

**Disable Unused Extensions:**
- Open Cursor → Extensions
- Disable extensions you don't actively use
- Language servers consume significant RAM

**Reduce TypeScript Memory:**
- Close unused workspace folders
- Restart Cursor periodically
- Limit open files (close tabs you're not using)

**Configure TypeScript:**
Create/update `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".next/cache/.tsbuildinfo"
  }
}
```

#### 2. **Optimize Next.js Development Server**

**Reduce Dev Server Memory:**
Update `frontend/package.json`:
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=2048' next dev -p 3001"
  }
}
```

**Use Production Build for Testing:**
Instead of `npm run dev`, use:
```bash
npm run build
npm run start  # Uses less memory
```

#### 3. **Clean Build Caches**

**Next.js Cache:**
```bash
cd frontend
rm -rf .next
npm run build  # Rebuilds cache
```

**Node Modules (if bloated):**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install  # Fresh install
```

#### 4. **System-Level Optimizations**

**Close Unused Applications:**
- Check Activity Monitor for memory hogs
- Close browser tabs you're not using
- Quit applications running in background

**Clear System Caches:**
```bash
# Clear npm cache
npm cache clean --force

# Clear Next.js cache
cd frontend && rm -rf .next

# Clear TypeScript cache
rm -rf ~/Library/Caches/typescript
```

**Restart Development Servers:**
- Stop and restart `npm run dev` periodically
- Restart Cursor IDE daily

#### 5. **Development Workflow Changes**

**Use Production Mode for Testing:**
```bash
# Instead of dev server
npm run build && npm run start
```

**Limit Concurrent Processes:**
- Don't run both frontend and backend dev servers simultaneously
- Use production builds when possible

**Use Lightweight Alternatives:**
- Consider using VS Code instead of Cursor if memory is critical
- Use terminal-based editors for quick edits

#### 6. **Monitor Memory Usage**

**Check Current Usage:**
```bash
# Top memory consumers
top -o mem -n 10

# Node processes
ps aux | grep node | sort -k4 -rn | head -10
```

**Set Up Alerts:**
- Monitor Activity Monitor regularly
- Set up memory pressure notifications (macOS)

### Recommended Immediate Actions

1. **Restart Cursor IDE** (frees up accumulated memory)
2. **Close unused browser tabs** (browsers are memory hogs)
3. **Stop dev servers when not actively coding**
4. **Clear Next.js cache**: `cd frontend && rm -rf .next`
5. **Disable unused Cursor extensions**

### Long-Term Solutions

1. **Upgrade RAM** (if possible) - 16GB is minimum for modern development
2. **Use production builds** instead of dev servers when testing
3. **Consider lighter IDE** (VS Code uses less memory than Cursor)
4. **Use Docker** for isolated development environments
5. **Split development** - work on frontend OR backend, not both simultaneously

---

## Quick Reference: Icon Import Pattern

```typescript
// Import only what you need (tree-shaking works)
import { 
  FiHome, 
  FiUsers, 
  FiTarget,
  FiRadio,
  FiGitBranch,
  FiRefreshCw,
  FiBriefcase
} from 'react-icons/fi';

// Usage
<FiHome className="w-4 h-4" />
```

**Note**: React Icons supports tree-shaking, so only imported icons are bundled.




