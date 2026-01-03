# MV-OS Development Guide

## 🏗️ Project Structure

```
Mvalley System/
├── backend/                 # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Database seed script
│   ├── src/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── users/          # User management
│   │   ├── students/       # Students module
│   │   ├── classes/        # Classes & sessions
│   │   ├── instructors/    # Instructors module
│   │   ├── finance/        # Payments & expenses
│   │   ├── sales/          # CRM & leads
│   │   ├── notifications/  # Messaging service
│   │   └── dashboard/      # Dashboard endpoints
│   └── package.json
│
├── frontend/                # Next.js Dashboard
│   ├── app/
│   │   ├── login/          # Login page
│   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── management/ # Management dashboard
│   │   │   ├── ops/        # Operations dashboard
│   │   │   ├── accounting/ # Accounting dashboard
│   │   │   ├── instructor/ # Instructor dashboard
│   │   │   ├── students/   # Students CRUD
│   │   │   ├── classes/    # Classes CRUD
│   │   │   └── sessions/   # Sessions list
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── api.ts          # Axios instance
│   │   └── services/       # API service functions
│   └── package.json
│
└── README.md
```

## 🔧 Development Workflow

### 1. Database Changes

When modifying the Prisma schema:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

### 2. Adding New Modules

**Backend:**
1. Create module folder: `src/module-name/`
2. Create service, controller, DTOs
3. Add module to `app.module.ts`
4. Add routes with proper guards

**Frontend:**
1. Create service in `lib/services/`
2. Create pages in `app/dashboard/module-name/`
3. Add navigation link in dashboard layout

### 3. API Development

**Example Service:**
```typescript
// backend/src/module/service.ts
@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.model.findMany({
      where: { deletedAt: null },
    });
  }
}
```

**Example Controller:**
```typescript
// backend/src/module/controller.ts
@Controller('module')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModuleController {
  @Get()
  @Roles(UserRole.super_admin, UserRole.operations)
  findAll() {
    return this.moduleService.findAll();
  }
}
```

### 4. Frontend Development

**Service Function:**
```typescript
// frontend/lib/services/module.service.ts
export const moduleService = {
  getAll: () => api.get('/module'),
  create: (data) => api.post('/module', data),
};
```

**Page Component:**
```typescript
// frontend/app/dashboard/module/page.tsx
'use client';

export default function ModulePage() {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    moduleService.getAll().then(res => setItems(res.data));
  }, []);
  
  return <div>...</div>;
}
```

## 🎨 UI Components

### Form Pattern
```tsx
<form onSubmit={handleSubmit}>
  <input
    value={formData.field}
    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
    className="mt-1 block w-full rounded-md border-gray-300"
  />
</form>
```

### Table Pattern
```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {items.map(item => (
      <tr key={item.id}>...</tr>
    ))}
  </tbody>
</table>
```

## 🔐 Security Best Practices

1. **Always use guards:**
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.super_admin)
   ```

2. **Validate input:**
   ```typescript
   @IsString()
   @MinLength(3)
   field: string;
   ```

3. **Never expose sensitive data:**
   - Instructors can't see payments
   - Students can only see their own data
   - Use select statements in Prisma

4. **Audit critical actions:**
   ```typescript
   await this.prisma.auditLog.create({
     data: { userId, action: 'create', entityType: 'Student' }
   });
   ```

## 📊 Dashboard Development

### Adding Metrics

1. Calculate in service:
```typescript
async getMetrics() {
  const revenue = await this.calculateRevenue();
  return { revenue };
}
```

2. Display in dashboard:
```tsx
<div className="bg-white p-6 rounded-lg shadow">
  <h3>Revenue</h3>
  <p className="text-2xl font-bold">{data.revenue}</p>
</div>
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:e2e
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐛 Debugging

### Backend
- Check logs in terminal
- Use Prisma Studio: `npx prisma studio`
- Check database directly

### Frontend
- Browser DevTools
- Network tab for API calls
- React DevTools

## 📝 Code Style

- Use TypeScript strict mode
- Follow NestJS conventions
- Use Tailwind CSS for styling
- Keep components small and focused
- Add comments for complex logic

## 🚀 Deployment Checklist

- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Seed production data (if needed)
- [ ] Test all endpoints
- [ ] Verify role permissions
- [ ] Check CORS settings
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

## 📚 Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)












