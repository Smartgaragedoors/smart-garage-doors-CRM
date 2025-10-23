import { useState, useEffect } from 'react';

// Permission categories and definitions
export const PERMISSION_CATEGORIES = {
  Dashboard: 'Dashboard & Analytics',
  Jobs: 'Job Management',
  Customers: 'Customer Management',
  Technicians: 'Technician Management',
  Pipeline: 'Pipeline & Workflow',
  Messages: 'Communication',
  Settings: 'System Settings',
  Users: 'User Management'
};

export const DEFAULT_PERMISSIONS = {
  // Dashboard permissions
  'dashboard.view': { name: 'View Dashboard', category: 'Dashboard', description: 'Access to main dashboard and analytics' },
  'dashboard.analytics': { name: 'View Analytics', category: 'Dashboard', description: 'Access to detailed analytics and reports' },
  
  // Jobs permissions
  'jobs.view': { name: 'View Jobs', category: 'Jobs', description: 'View all jobs in the system' },
  'jobs.create': { name: 'Create Jobs', category: 'Jobs', description: 'Create new jobs and leads' },
  'jobs.edit': { name: 'Edit Jobs', category: 'Jobs', description: 'Modify existing job details' },
  'jobs.delete': { name: 'Delete Jobs', category: 'Jobs', description: 'Remove jobs from the system' },
  'jobs.assign': { name: 'Assign Jobs', category: 'Jobs', description: 'Assign jobs to technicians' },
  'jobs.pricing': { name: 'Manage Pricing', category: 'Jobs', description: 'Set and modify job pricing' },
  
  // Customers permissions
  'customers.view': { name: 'View Customers', category: 'Customers', description: 'Access customer information' },
  'customers.create': { name: 'Create Customers', category: 'Customers', description: 'Add new customers to the system' },
  'customers.edit': { name: 'Edit Customers', category: 'Customers', description: 'Modify customer information' },
  'customers.delete': { name: 'Delete Customers', category: 'Customers', description: 'Remove customers from the system' },
  
  // Technicians permissions
  'technicians.view': { name: 'View Technicians', category: 'Technicians', description: 'Access technician information' },
  'technicians.create': { name: 'Create Technicians', category: 'Technicians', description: 'Add new technicians' },
  'technicians.edit': { name: 'Edit Technicians', category: 'Technicians', description: 'Modify technician information' },
  'technicians.delete': { name: 'Delete Technicians', category: 'Technicians', description: 'Remove technicians from the system' },
  'technicians.commissions': { name: 'Manage Commissions', category: 'Technicians', description: 'Set and modify commission rates' },
  
  // Pipeline permissions
  'pipeline.view': { name: 'View Pipeline', category: 'Pipeline', description: 'Access pipeline and kanban boards' },
  'pipeline.edit': { name: 'Edit Pipeline', category: 'Pipeline', description: 'Modify pipeline stages and job status' },
  'pipeline.configure': { name: 'Configure Pipeline', category: 'Pipeline', description: 'Manage pipeline stages and workflow' },
  
  // Messages permissions
  'messages.view': { name: 'View Messages', category: 'Messages', description: 'Access messaging system' },
  'messages.send': { name: 'Send Messages', category: 'Messages', description: 'Send messages to team members' },
  'messages.broadcast': { name: 'Broadcast Messages', category: 'Messages', description: 'Send messages to multiple recipients' },
  
  // Settings permissions
  'settings.view': { name: 'View Settings', category: 'Settings', description: 'Access system settings' },
  'settings.company': { name: 'Company Settings', category: 'Settings', description: 'Modify company information' },
  'settings.forms': { name: 'Form Configuration', category: 'Settings', description: 'Configure intake forms and fields' },
  'settings.pipeline': { name: 'Pipeline Settings', category: 'Settings', description: 'Configure pipeline stages' },
  'settings.notifications': { name: 'Notification Settings', category: 'Settings', description: 'Configure notification preferences' },
  'settings.import': { name: 'Data Import', category: 'Settings', description: 'Import data from CSV files' },
  'settings.permissions': { name: 'Manage Permissions', category: 'Settings', description: 'Configure user roles and permissions' },
  
  // User management permissions
  'users.view': { name: 'View Users', category: 'Users', description: 'Access user management' },
  'users.create': { name: 'Create Users', category: 'Users', description: 'Add new users to the system' },
  'users.edit': { name: 'Edit Users', category: 'Users', description: 'Modify user information and roles' },
  'users.delete': { name: 'Delete Users', category: 'Users', description: 'Remove users from the system' },
  'users.permissions': { name: 'Manage User Permissions', category: 'Users', description: 'Assign roles and permissions to users' }
};

// Default role configurations
export const DEFAULT_ROLES = {
  owner: {
    name: 'owner',
    displayName: 'Business Owner',
    description: 'Full access to all system features and settings',
    permissions: Object.keys(DEFAULT_PERMISSIONS), // All permissions
    isSystemRole: true
  },
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access with most permissions',
    permissions: Object.keys(DEFAULT_PERMISSIONS).filter(p => !p.includes('settings.permissions')),
    isSystemRole: true
  },
  dispatcher: {
    name: 'dispatcher',
    displayName: 'Dispatcher',
    description: 'Manages jobs, schedules, and customer communications',
    permissions: [
      'dashboard.view',
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.assign', 'jobs.pricing',
      'customers.view', 'customers.create', 'customers.edit',
      'technicians.view',
      'pipeline.view', 'pipeline.edit',
      'messages.view', 'messages.send', 'messages.broadcast',
      'settings.view', 'settings.notifications'
    ],
    isSystemRole: true
  },
  technician: {
    name: 'technician',
    displayName: 'Technician',
    description: 'Views assigned jobs and updates job status',
    permissions: [
      'dashboard.view',
      'jobs.view', 'jobs.edit',
      'customers.view',
      'pipeline.view', 'pipeline.edit',
      'messages.view', 'messages.send'
    ],
    isSystemRole: true
  }
};

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export function usePermissions() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissionsData();
  }, []);

  const loadPermissionsData = () => {
    try {
      setLoading(true);
      
      // Load roles from localStorage or use defaults
      const savedRoles = localStorage.getItem('userRoles');
      const savedUsers = localStorage.getItem('systemUsers');
      
      if (savedRoles) {
        setRoles(JSON.parse(savedRoles));
      } else {
        // Initialize with default roles
        const defaultRoles = Object.values(DEFAULT_ROLES).map((role, index) => ({
          id: `role-${index + 1}`,
          ...role
        }));
        setRoles(defaultRoles);
        localStorage.setItem('userRoles', JSON.stringify(defaultRoles));
      }
      
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        // Initialize with demo users
        const demoUsers = [
          {
            id: 'user-1',
            email: 'owner@smartgarage.com',
            name: 'Business Owner',
            roleId: 'role-1',
            roleName: 'owner',
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'user-2',
            email: 'dispatcher@smartgarage.com',
            name: 'Main Dispatcher',
            roleId: 'role-3',
            roleName: 'dispatcher',
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
        setUsers(demoUsers);
        localStorage.setItem('systemUsers', JSON.stringify(demoUsers));
      }
    } catch (error) {
      console.error('Error loading permissions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermissions = (roleId: string, permissions: string[]) => {
    const updatedRoles = roles.map(role => 
      role.id === roleId ? { ...role, permissions } : role
    );
    setRoles(updatedRoles);
    localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
  };

  const createRole = (roleData: Omit<UserRole, 'id'>) => {
    const newRole = {
      ...roleData,
      id: `role-${Date.now()}`
    };
    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
    return newRole;
  };

  const updateRole = (roleId: string, updates: Partial<UserRole>) => {
    const updatedRoles = roles.map(role => 
      role.id === roleId ? { ...role, ...updates } : role
    );
    setRoles(updatedRoles);
    localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) {
      throw new Error('Cannot delete system roles');
    }
    
    const updatedRoles = roles.filter(role => role.id !== roleId);
    setRoles(updatedRoles);
    localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const role = roles.find(r => r.id === userData.roleId);
    const newUser = {
      ...userData,
      id: `user-${Date.now()}`,
      roleName: role?.name || 'unknown',
      createdAt: new Date().toISOString()
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const role = roles.find(r => r.id === updates.roleId);
        return { 
          ...user, 
          ...updates,
          roleName: role?.name || user.roleName
        };
      }
      return user;
    });
    setUsers(updatedUsers);
    localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
  };

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
  };

  const hasPermission = (permission: string, userRole?: string) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const roleToCheck = userRole || currentUser.userType;
    
    if (roleToCheck === 'owner') return true; // Owner has all permissions
    
    const role = roles.find(r => r.name === roleToCheck);
    return role?.permissions.includes(permission) || false;
  };

  const getUserPermissions = (userRole: string) => {
    const role = roles.find(r => r.name === userRole);
    return role?.permissions || [];
  };

  const getRoleById = (roleId: string) => {
    return roles.find(r => r.id === roleId);
  };

  const getRoleByName = (roleName: string) => {
    return roles.find(r => r.name === roleName);
  };

  // Add user count to roles
  const rolesWithUserCount = roles.map(role => ({
    ...role,
    userCount: users.filter(user => user.roleId === role.id).length
  }));

  return {
    roles: rolesWithUserCount,
    users,
    loading,
    permissions: DEFAULT_PERMISSIONS,
    permissionCategories: PERMISSION_CATEGORIES,
    updateRolePermissions,
    createRole,
    updateRole,
    deleteRole,
    createUser,
    updateUser,
    deleteUser,
    hasPermission,
    getUserPermissions,
    getRoleById,
    getRoleByName,
    refetch: loadPermissionsData
  };
}