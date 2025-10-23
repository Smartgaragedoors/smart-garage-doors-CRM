import React, { useState, useEffect } from 'react';
import { supabase, isDemoEnvironment } from '../../lib/supabase';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';

interface Supply {
  id: number;
  name: string;
  category: string;
  part_number?: string;
  description?: string;
  tech_price: number;
  purchase_price: number;
  markup_percentage: number;
  stock_quantity: number;
  min_stock_level: number;
  supplier?: string;
  supplier_contact?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categories = [
  'Springs',
  'Openers', 
  'Hardware',
  'Weather Stripping',
  'Safety',
  'Security',
  'Tools',
  'Other'
];

export default function Supplies() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'tech_price' | 'stock_quantity'>('name');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Springs',
    part_number: '',
    description: '',
    tech_price: '',
    purchase_price: '',
    stock_quantity: '',
    min_stock_level: '5',
    supplier: '',
    supplier_contact: '',
    notes: ''
  });

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        // Mock data for demo
        const mockSupplies: Supply[] = [
          {
            id: 1,
            name: 'Extension Spring 28"',
            category: 'Springs',
            part_number: 'ES-28-150',
            description: '28 inch extension spring, 150 lb capacity',
            tech_price: 45.00,
            purchase_price: 28.50,
            markup_percentage: 57.89,
            stock_quantity: 10,
            min_stock_level: 5,
            supplier: 'Garage Door Supply Co',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Chain Drive Opener',
            category: 'Openers',
            part_number: 'CD-8500',
            description: '1/2 HP chain drive garage door opener',
            tech_price: 180.00,
            purchase_price: 115.00,
            markup_percentage: 56.52,
            stock_quantity: 5,
            min_stock_level: 3,
            supplier: 'LiftMaster',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 3,
            name: 'Garage Door Roller',
            category: 'Hardware',
            part_number: 'GR-10',
            description: '10 ball bearing garage door roller',
            tech_price: 8.50,
            purchase_price: 5.20,
            markup_percentage: 63.46,
            stock_quantity: 50,
            min_stock_level: 10,
            supplier: 'Hardware Supply',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];
        setSupplies(mockSupplies);
        return;
      }

      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSupplies(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Springs',
      part_number: '',
      description: '',
      tech_price: '',
      purchase_price: '',
      stock_quantity: '',
      min_stock_level: '5',
      supplier: '',
      supplier_contact: '',
      notes: ''
    });
  };

  const handleAddSupply = () => {
    resetForm();
    setSelectedSupply(null);
    setShowAddModal(true);
  };

  const handleEditSupply = (supply: Supply) => {
    setFormData({
      name: supply.name,
      category: supply.category,
      part_number: supply.part_number || '',
      description: supply.description || '',
      tech_price: supply.tech_price.toString(),
      purchase_price: supply.purchase_price.toString(),
      stock_quantity: supply.stock_quantity.toString(),
      min_stock_level: supply.min_stock_level.toString(),
      supplier: supply.supplier || '',
      supplier_contact: supply.supplier_contact || '',
      notes: supply.notes || ''
    });
    setSelectedSupply(supply);
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isDemoEnvironment) {
        if (selectedSupply) {
          setShowEditModal(false);
        } else {
          setShowAddModal(false);
        }
        resetForm();
        await fetchSupplies();
        alert('Supply saved successfully! (Demo Mode)');
        return;
      }

      const supplyData = {
        name: formData.name.trim(),
        category: formData.category,
        part_number: formData.part_number.trim() || null,
        description: formData.description.trim() || null,
        tech_price: parseFloat(formData.tech_price),
        purchase_price: parseFloat(formData.purchase_price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        supplier: formData.supplier.trim() || null,
        supplier_contact: formData.supplier_contact.trim() || null,
        notes: formData.notes.trim() || null
      };

      if (selectedSupply) {
        const { error } = await supabase
          .from('supplies')
          .update(supplyData)
          .eq('id', selectedSupply.id);

        if (error) throw error;
        setShowEditModal(false);
      } else {
        const { error } = await supabase
          .from('supplies')
          .insert([supplyData]);

        if (error) throw error;
        setShowAddModal(false);
      }

      resetForm();
      await fetchSupplies();
      alert('Supply saved successfully!');
    } catch (error: any) {
      console.error('Error saving supply:', error);
      alert('Failed to save supply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupply = async (supplyId: number) => {
    if (confirm('Are you sure you want to delete this supply?')) {
      try {
        if (isDemoEnvironment) {
          setSupplies(prev => prev.filter(s => s.id !== supplyId));
          alert('Supply deleted successfully! (Demo Mode)');
          return;
        }

        const { error } = await supabase
          .from('supplies')
          .update({ is_active: false })
          .eq('id', supplyId);

        if (error) throw error;
        await fetchSupplies();
        alert('Supply deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting supply:', error);
        alert('Failed to delete supply. Please try again.');
      }
    }
  };

  const filteredSupplies = supplies
    .filter(supply => {
      const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supply.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supply.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || supply.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'tech_price':
          return b.tech_price - a.tech_price;
        case 'stock_quantity':
          return a.stock_quantity - b.stock_quantity;
        default:
          return 0;
      }
    });

  const getStockStatusColor = (supply: Supply) => {
    if (supply.stock_quantity === 0) return 'text-red-600 bg-red-100';
    if (supply.stock_quantity <= supply.min_stock_level) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (supply: Supply) => {
    if (supply.stock_quantity === 0) return 'Out of Stock';
    if (supply.stock_quantity <= supply.min_stock_level) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supplies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplies Management</h1>
          <p className="text-gray-600">Manage your inventory and pricing</p>
        </div>
        <Button onClick={handleAddSupply} className="bg-blue-600 hover:bg-blue-700">
          <i className="ri-add-line mr-2"></i>
          Add Supply
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search supplies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="tech_price">Tech Price</option>
                <option value="stock_quantity">Stock Quantity</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSortBy('name');
                }}
                className="w-full bg-gray-500 hover:bg-gray-600"
              >
                <i className="ri-refresh-line mr-2"></i>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Supplies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supply</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tech Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Markup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSupplies.map((supply) => (
                <tr key={supply.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supply.name}</div>
                      {supply.description && (
                        <div className="text-sm text-gray-500">{supply.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {supply.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supply.part_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${supply.tech_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${supply.purchase_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-green-600 font-medium">
                      {supply.markup_percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{supply.stock_quantity}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(supply)}`}>
                        {getStockStatusText(supply)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supply.supplier || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSupply(supply)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteSupply(supply.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSupply ? 'Edit Supply' : 'Add New Supply'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supply Name *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Number</label>
                  <Input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tech Price *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tech_price}
                    onChange={(e) => setFormData({ ...formData, tech_price: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
                  <Input
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <Input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Contact</label>
                  <Input
                    type="text"
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : (selectedSupply ? 'Update Supply' : 'Add Supply')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
