
import { useState } from 'react';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { useTechnicians, useCustomers } from '../../hooks/useSupabase';

export default function Technicians() {
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  const [newTechData, setNewTechData] = useState({
    name: '',
    email: '',
    phone: '',
    commission_rate: 10,
    status: 'active'
  });
  const [editTechData, setEditTechData] = useState({
    name: '',
    email: '',
    phone: '',
    commission_rate: 10,
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use Supabase hooks for technicians and customers
  const { technicians, loading, error, updateTechnician, refetch } = useTechnicians();
  const { customers } = useCustomers();

  // Calculate technician stats using real data from all_jobs
  const technicianStats = technicians.map(tech => {
    const techStats = {
      totalJobs: 0,
      completedJobs: 0,
      activeJobs: 0,
      totalRevenue: 0,
      commission: 0,
      totalCosts: 0,
      totalProfit: 0
    };

    // Go through all customers and their jobs to find jobs for this technician
    customers.forEach(customer => {
      customer.locations?.forEach(location => {
        location.jobs?.forEach(job => {
          // Handle multiple technicians (comma-separated)
          const technicians = job.technician_name?.split(',').map(t => t.trim()).filter(Boolean) || [];
          
          if (technicians.includes(tech.name)) {
            const techCount = technicians.length;
            
            // Count jobs as whole numbers (each job counts as 1 job per technician)
            techStats.totalJobs += 1;
            
            // Split revenue and costs among technicians proportionally
            techStats.totalRevenue += (parseFloat(String(job.sales).replace(/[^0-9.-]/g, '')) || 0) / techCount;
            techStats.totalCosts += (parseFloat(String(job.total_costs).replace(/[^0-9.-]/g, '')) || 0) / techCount;
            techStats.totalProfit += (parseFloat(String(job.gross_profit).replace(/[^0-9.-]/g, '')) || 0) / techCount;
            
            // Count completed vs active jobs as whole numbers
            if (job.status === 'Closed' || job.status === 'Completed' || job.status === 'Finished') {
              techStats.completedJobs += 1;
            } else {
              techStats.activeJobs += 1;
            }
          }
        });
      });
    });

    // Calculate commission (different rates for owners vs technicians)
    if (tech.name === 'Dan' || tech.name === 'Ben') {
      techStats.commission = techStats.totalRevenue * 0.5; // 50% for owners
    } else {
      techStats.commission = techStats.totalRevenue * 0.3; // 30% for technicians
    }

    return {
      ...tech,
      totalJobs: Math.round(techStats.totalJobs), // Whole numbers only
      completedJobs: Math.round(techStats.completedJobs), // Whole numbers only
      activeJobs: Math.round(techStats.activeJobs), // Whole numbers only
      totalRevenue: Math.round(techStats.totalRevenue),
      commission: Math.round(techStats.commission),
      totalCosts: Math.round(techStats.totalCosts),
      totalProfit: Math.round(techStats.totalProfit)
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending

  const selectedTechData = selectedTechnician 
    ? technicianStats.find(tech => tech.id === selectedTechnician)
    : null;

  // Get jobs for selected technician from real data
  const techJobs = selectedTechData ? (() => {
    const jobs: any[] = [];
    
    customers.forEach(customer => {
      customer.locations?.forEach(location => {
        location.jobs?.forEach(job => {
          const technicians = job.technician_name?.split(',').map(t => t.trim()).filter(Boolean) || [];
          if (technicians.includes(selectedTechData.name)) {
            jobs.push({
              ...job,
              customer_name: customer.name,
              customer_phone: customer.phone,
              customer_email: customer.email,
              address: job.address || location.address
            });
          }
        });
      });
    });
    
    return jobs.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
  })() : [];

  const handleEditTechnician = (technician: any) => {
    setEditingTechnician(technician);
    setEditTechData({
      name: technician.name,
      email: technician.email || '',
      phone: technician.phone || '',
      commission_rate: technician.commission_rate,
      status: technician.status
    });
    setShowEditModal(true);
  };

  const handleUpdateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/technicians?id=eq.${editingTechnician.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...editTechData,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to update technician');

      // Reset form and close modal
      setEditTechData({
        name: '',
        email: '',
        phone: '',
        commission_rate: 10,
        status: 'active'
      });
      setShowEditModal(false);
      setEditingTechnician(null);
      
      // Refresh technicians list
      refetch();
    } catch (error) {
      console.error('Error updating technician:', error);
      alert('Failed to update technician. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newTechData)
      });

      if (!response.ok) throw new Error('Failed to add technician');

      // Reset form and close modal
      setNewTechData({
        name: '',
        email: '',
        phone: '',
        commission_rate: 10,
        status: 'active'
      });
      setShowAddModal(false);
      
      // Refresh technicians list
      refetch();
    } catch (error) {
      console.error('Error adding technician:', error);
      alert('Failed to add technician. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTechnician = async (technicianId: string) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/technicians?id=eq.${technicianId}`, {
        method: 'DELETE',
        headers: {
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete technician');

      setShowDeleteModal(null);
      if (selectedTechnician === technicianId) {
        setSelectedTechnician(null);
      }
      
      // Refresh technicians list
      refetch();
    } catch (error) {
      console.error('Error deleting technician:', error);
      alert('Failed to delete technician. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCommission = async (technicianId: string, newRate: number) => {
    try {
      await updateTechnician(technicianId, { commission_rate: newRate });
    } catch (error) {
      console.error('Error updating commission rate:', error);
      alert('Failed to update commission rate. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Lead': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Awaiting Parts': return 'bg-purple-100 text-purple-800';
      case 'Pending Payment': return 'bg-orange-100 text-orange-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin"></i>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Technicians</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Technicians & Commissions</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <i className="ri-user-add-line mr-2"></i>
            Add Technician
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-user-settings-line text-2xl text-blue-600"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{technicians.length}</p>
              <p className="text-sm text-gray-600">Active Technicians</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${technicianStats.reduce((sum, tech) => sum + tech.commission, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Commissions</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-briefcase-line text-2xl text-orange-600"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {technicianStats.reduce((sum, tech) => sum + tech.activeJobs, 0)}
              </p>
              <p className="text-sm text-gray-600">Active Jobs</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-star-line text-2xl text-purple-600"></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {technicianStats.length > 0 ? Math.round(technicianStats.reduce((sum, tech) => sum + tech.totalRevenue, 0) / technicianStats.reduce((sum, tech) => sum + tech.totalJobs, 0)) : 0}
              </p>
              <p className="text-sm text-gray-600">Avg Job Value</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technicians List */}
          <div className="lg:col-span-1">
            <Card title="Technicians">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {technicianStats.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechnician(tech.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTechnician === tech.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {tech.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                        <p className="text-sm text-gray-600">{tech.phone}</p>
                        <p className="text-xs text-gray-500">{tech.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ${tech.commission.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Commission</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-blue-600">
                            ${tech.totalRevenue.toLocaleString()} revenue
                          </p>
                          <p className="text-xs text-gray-500">
                            {tech.totalJobs} total jobs
                          </p>
                          <p className="text-xs text-green-600">
                            {tech.completedJobs} completed
                          </p>
                          <p className="text-xs text-orange-600">
                            {tech.activeJobs} active
                          </p>
                        </div>
                        <div className="flex space-x-1 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTechnician(tech);
                            }}
                            className="text-blue-400 hover:text-blue-600"
                            title="Edit technician"
                          >
                            <i className="ri-edit-line text-sm"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteModal(tech.id);
                            }}
                            className="text-red-400 hover:text-red-600"
                            title="Delete technician"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Technician Details */}
          <div className="lg:col-span-2">
            {selectedTechData ? (
              <div className="space-y-6">
                {/* Technician Profile */}
                <Card>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {selectedTechData.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedTechData.name}</h2>
                        <p className="text-gray-600">{selectedTechData.phone}</p>
                        <p className="text-gray-500">{selectedTechData.email}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm text-blue-600 font-medium">Commission Rate:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={selectedTechData.commission_rate}
                            onChange={(e) => handleUpdateCommission(selectedTechData.id, parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Commission</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${selectedTechData.commission.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        From ${selectedTechData.totalRevenue.toLocaleString()} revenue
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="ri-briefcase-line text-2xl text-blue-600"></i>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{selectedTechData.totalJobs}</p>
                      <p className="text-sm text-gray-600">Total Jobs</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{selectedTechData.completedJobs}</p>
                      <p className="text-sm text-gray-600">Completed Jobs</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="ri-time-line text-2xl text-orange-600"></i>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{selectedTechData.activeJobs}</p>
                      <p className="text-sm text-gray-600">Active Jobs</p>
                    </div>
                  </Card>
                </div>

                {/* Recent Jobs */}
                <Card title="Recent Jobs">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Commission
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {techJobs.slice(0, 10).map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {job.customer_name}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">{job.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                job.status === 'Closed' || job.status === 'Completed' || job.status === 'Finished'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${(Number(job.sales) || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              ${Math.round((Number(job.sales) || 0) * (selectedTechData.name === 'Dan' || selectedTechData.name === 'Ben' ? 0.5 : 0.3))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <i className="ri-user-settings-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Technician</h3>
                  <p className="text-gray-500">Choose a technician from the list to view their performance and commission details.</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Add Technician Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Technician</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleAddTechnician} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newTechData.name}
                    onChange={(e) => setNewTechData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter technician name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newTechData.email}
                    onChange={(e) => setNewTechData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newTechData.phone}
                    onChange={(e) => setNewTechData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newTechData.commission_rate}
                    onChange={(e) => setNewTechData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter commission percentage"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line mr-2 animate-spin"></i>
                        Adding...
                      </>
                    ) : (
                      'Add Technician'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Technician Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Technician</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTechnician(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleUpdateTechnician} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editTechData.name}
                    onChange={(e) => setEditTechData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter technician name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editTechData.email}
                    onChange={(e) => setEditTechData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editTechData.phone}
                    onChange={(e) => setEditTechData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editTechData.commission_rate}
                    onChange={(e) => setEditTechData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter commission percentage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editTechData.status}
                    onChange={(e) => setEditTechData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTechnician(null);
                    }}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line mr-2 animate-spin"></i>
                        Updating...
                      </>
                    ) : (
                      'Update Technician'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-error-warning-line text-2xl text-red-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Technician</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this technician? All associated data will be removed.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteTechnician(showDeleteModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line mr-2 animate-spin"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-line mr-2"></i>
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
