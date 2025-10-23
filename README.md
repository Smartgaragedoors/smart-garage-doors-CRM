# Smart Garage CRM System

A comprehensive Customer Relationship Management system designed specifically for garage door service businesses. Built with React, TypeScript, and Supabase for modern, scalable business management.

## 🚀 Features

### Core Functionality
- **Dashboard Analytics** - Real-time business metrics and performance tracking
- **Jobs Management** - Complete job lifecycle from lead to completion
- **Customer Management** - Comprehensive customer profiles with job history
- **Technician Management** - Staff scheduling and commission tracking
- **Schedule Management** - Calendar views and appointment scheduling
- **Pipeline Management** - Visual Kanban boards for job status tracking

### Business Intelligence
- **Financial Tracking** - Revenue, costs, profit margins, and commission calculations
- **Lead Source Analytics** - Track performance across different marketing channels
- **Customer Analytics** - Lifetime value, repeat business, and customer segmentation
- **Technician Performance** - Individual performance metrics and commission tracking

### Advanced Features
- **Mobile Responsive** - Optimized for desktop, tablet, and mobile devices
- **Real-time Updates** - Live data synchronization across all devices
- **Export Capabilities** - Excel export for reporting and backup
- **Role-based Access** - Secure user management and permissions
- **Demo Mode** - Full functionality demonstration with sample data

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Drag & Drop**: Dnd-kit for Kanban boards
- **Build Tool**: Vite for fast development and building

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (optional - demo mode available)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-garage-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_PUBLIC_SUPABASE_URL=your_supabase_url
   VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Note**: If environment variables are not set, the application will run in demo mode with sample data.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🗄 Database Schema

### Core Tables

#### `all_jobs` - Main Job Records
- **Client Information**: Name, email, phone, address
- **Job Details**: Description, status, sales amount, technician
- **Financial Data**: Revenue, costs, profit, commission rates
- **Timing**: Date, month, week tracking
- **Lead Source**: Marketing channel tracking

#### `customers` - Customer Profiles
- **Contact Information**: Name, email, phone, address
- **Business Data**: Customer type, status, tags
- **Analytics**: Total jobs, revenue, profit calculations

#### `technicians` - Staff Management
- **Personal Info**: Name, email, phone
- **Business Settings**: Commission rate, status
- **Performance**: Job counts, revenue generated

#### `pipeline_stages` - Job Status Management
- **Stage Configuration**: Name, color, order position
- **Customization**: Add, edit, delete stages

## 🎨 UI/UX Design

### Design Philosophy
- **Modern & Clean**: Minimalist design with focus on functionality
- **Professional**: Enterprise-grade appearance suitable for business use
- **Accessible**: WCAG compliant with proper contrast and navigation
- **Responsive**: Mobile-first design that works on all devices

### Color Scheme
- **Primary**: Blue gradient (#3B82F6 to #1D4ED8)
- **Success**: Green gradient (#10B981 to #059669)
- **Warning**: Amber gradient (#F59E0B to #D97706)
- **Danger**: Red gradient (#EF4444 to #DC2626)
- **Neutral**: Gray scale for text and backgrounds

### Components
- **Cards**: Elevated containers with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Clean inputs with validation states
- **Charts**: Professional data visualization
- **Tables**: Sortable, filterable data grids

## 📊 Business Logic

### Financial Calculations
- **Revenue**: Sum of all completed job sales
- **Costs**: Parts, labor, and overhead expenses
- **Profit**: Revenue minus total costs
- **Commission**: Technician payout based on role (50% owners, 30% staff)

### Lead Source Mapping
- **Thumbtack**: TT
- **Angie's List**: AG
- **Referral**: RF
- **Website**: WB
- **Google Ads**: GA
- **Facebook**: FB
- **Phone Call**: PC

### Job Status Flow
1. **New Lead** → Initial contact and qualification
2. **In Progress** → Work has begun
3. **Awaiting Parts** → Waiting for materials
4. **Pending Payment** → Work complete, awaiting payment
5. **Closed** → Job completed and paid
6. **Cancelled** → Job cancelled or not completed

## 🔧 Customization

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update routing in `src/router/config.tsx`
4. Add new hooks in `src/hooks/useSupabase.ts`

### Styling Customization
- Modify `tailwind.config.ts` for theme changes
- Update `src/index.css` for global styles
- Customize component styles in individual files

### Database Customization
- Add new tables in Supabase
- Update hooks to include new data
- Modify forms to handle new fields

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Vercel**: Connect GitHub repository for automatic deployments
- **Netlify**: Drag and drop the `out` folder
- **AWS S3**: Upload build files to S3 bucket
- **Docker**: Use provided Dockerfile for containerized deployment

### Environment Variables
Ensure production environment has:
- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`

## 📱 Mobile Features

### Responsive Design
- **Sidebar**: Collapsible navigation for mobile
- **Touch-friendly**: Large tap targets and gestures
- **Optimized Layout**: Stacked layouts for small screens
- **Fast Loading**: Optimized images and code splitting

### Mobile-specific Features
- **Auto-collapse**: Sidebar closes after navigation
- **Touch Gestures**: Swipe and tap interactions
- **Mobile Menu**: Hamburger menu for navigation
- **Responsive Charts**: Charts adapt to screen size

## 🔒 Security

### Authentication
- Supabase Auth integration
- Role-based access control
- Secure session management

### Data Protection
- Environment variable protection
- SQL injection prevention
- XSS protection
- CSRF protection

## 📈 Performance

### Optimization Features
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Compressed and responsive images
- **Caching**: Browser and CDN caching
- **Bundle Size**: Optimized JavaScript bundles

### Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Core Web Vitals tracking
- **User Analytics**: Usage pattern analysis

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use meaningful component and variable names
3. Add proper error handling
4. Include loading states
5. Write responsive CSS
6. Test on multiple devices

### Code Style
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **TypeScript**: Strict type checking
- **Tailwind**: Utility-first CSS

## 📞 Support

### Documentation
- **API Documentation**: Supabase documentation
- **Component Library**: Storybook integration
- **User Guide**: In-app help system

### Contact
- **Email**: support@smartgarage.com
- **Documentation**: [docs.smartgarage.com](https://docs.smartgarage.com)
- **Issues**: GitHub Issues for bug reports

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

### Upcoming Features
- **Advanced Reporting**: Custom report builder
- **Integration APIs**: Third-party service connections
- **Mobile App**: Native iOS/Android applications
- **AI Features**: Predictive analytics and recommendations
- **Multi-tenant**: Support for multiple businesses

---

**Smart Garage CRM** - Professional business management for the modern garage door service industry.#   s m a r t - g a r a g e - d o o r s - C R M  
 