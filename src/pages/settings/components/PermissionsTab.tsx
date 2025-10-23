import { useState } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: any) => void;
}

function CreateRoleModal({ isOpen, onClose, onSave }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });
  const { permissions, permissionCategories } = usePermissions();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      isSystemRole: false
    });
    setFormData({ name: '', displayName: '', description: '', permissions: [] });
    onClose();
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = Object.keys(permissions).filter(
      p => permissions[p].category === category
    );
    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermissions])]
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create New Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., manager"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Manager"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe the role and its responsibilities"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-4">
              {Object.entries(permissionCategories).map(([category, displayName]) => {
                const categoryPermissions = Object.keys(permissions).filter(
                  p => permissions[p].category === category
                );
                const selectedCount = categoryPermissions.filter(p => formData.permissions.includes(p)).length;
                const allSelected = selectedCount === categoryPermissions.length;
                const someSelected = selectedCount > 0 && selectedCount < categoryPermissions.length;

                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{displayName}</h4>
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions(category)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          allSelected
                            ? 'bg-blue-100 text-blue-700'
                            : someSelected
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryPermissions.map(permission => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                            className="mr-2"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {permissions[permission].name}
                            </span>
                            <p className="text-xs text-gray-500">
                              {permissions[permission].description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  roles: any[];
}

function CreateUserModal({ isOpen, onClose, onSave, roles }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    roleId: '',
    isActive: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ email: '', name: '', roleId: '', isActive: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              required
              value={formData.roleId}
              onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active user
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PermissionsTab() {
  const {
    roles,
    users,
    permissions,
    permissionCategories,
    updateRolePermissions,
    createRole,
    updateRole,
    deleteRole,
    createUser,
    updateUser,
    deleteUser
  } = usePermissions();

  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handlePermissionChange = (roleId: string, permission: string, granted: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const updatedPermissions = granted
      ? [...role.permissions, permission]
      : role.permissions.filter(p => p !== permission);

    updateRolePermissions(roleId, updatedPermissions);
    setSaveStatus('saving');
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleCategoryPermissionChange = (roleId: string, category: string, granted: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const categoryPermissions = Object.keys(permissions).filter(
      p => permissions[p].category === category
    );

    let updatedPermissions;
    if (granted) {
      updatedPermissions = [...new Set([...role.permissions, ...categoryPermissions])];
    } else {
      updatedPermissions = role.permissions.filter(p => !categoryPermissions.includes(p));
    }

    updateRolePermissions(roleId, updatedPermissions);
    setSaveStatus('saving');
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleCreateRole = (roleData: any) => {
    createRole(roleData);
  };

  const handleCreateUser = (userData: any) => {
    createUser(userData);
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        deleteRole(roleId);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUser(userId);
    }
  };

  const toggleUserStatus = (userId: string, isActive: boolean) => {
    updateUser(userId, { isActive });
  };

  const changeUserRole = (userId: string, roleId: string) => {
    updateUser(userId, { roleId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Control</h2>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        {saveStatus === 'saved' && (
          <div className="flex items-center text-green-600">
            <i className="ri-check-line mr-2"></i>
            <span className="text-sm">Changes saved</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-shield-user-line mr-2"></i>
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-team-line mr-2"></i>
            User Management
          </button>
        </nav>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Configure roles and their permissions</p>
            <Button onClick={() => setShowCreateRoleModal(true)}>
              <i className="ri-add-line mr-2"></i>
              Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles List */}
            <div className="lg:col-span-1">
              <Card title="Roles">
                <div className="space-y-2">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedRole === role.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{role.displayName}</h4>
                          <p className="text-sm text-gray-500">{role.userCount} users</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {role.isSystemRole && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              System
                            </span>
                          )}
                          {!role.isSystemRole && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRole(role.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Permissions Matrix */}
            <div className="lg:col-span-2">
              {selectedRole ? (
                <Card title={`Permissions - ${roles.find(r => r.id === selectedRole)?.displayName}`}>
                  <div className="space-y-6">
                    {Object.entries(permissionCategories).map(([category, displayName]) => {
                      const categoryPermissions = Object.keys(permissions).filter(
                        p => permissions[p].category === category
                      );
                      const role = roles.find(r => r.id === selectedRole);
                      const grantedCount = categoryPermissions.filter(p => role?.permissions.includes(p)).length;
                      const allGranted = grantedCount === categoryPermissions.length;
                      const someGranted = grantedCount > 0 && grantedCount < categoryPermissions.length;

                      return (
                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">{displayName}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {grantedCount}/{categoryPermissions.length}
                              </span>
                              <button
                                onClick={() => handleCategoryPermissionChange(selectedRole, category, !allGranted)}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  allGranted
                                    ? 'bg-green-100 text-green-700'
                                    : someGranted
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {allGranted ? 'Revoke All' : 'Grant All'}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {categoryPermissions.map(permission => {
                              const isGranted = role?.permissions.includes(permission) || false;
                              return (
                                <div key={permission} className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {permissions[permission].name}
                                    </h5>
                                    <p className="text-sm text-gray-500">
                                      {permissions[permission].description}
                                    </p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={isGranted}
                                      onChange={(e) => handlePermissionChange(selectedRole, permission, e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <i className="ri-shield-user-line text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
                    <p className="text-gray-500">Choose a role from the list to configure its permissions</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Manage system users and their roles</p>
            <Button onClick={() => setShowCreateUserModal(true)}>
              <i className="ri-user-add-line mr-2"></i>
              Add User
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => {
                    const userRole = roles.find(r => r.id === user.roleId);
                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.roleId}
                            onChange={(e) => changeUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.displayName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={user.isActive}
                              onChange={(e) => toggleUserStatus(user.id, e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        onSave={handleCreateRole}
      />

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onSave={handleCreateUser}
        roles={roles}
      />
    </div>
  );
}