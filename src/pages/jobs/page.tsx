import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { useJobs, useTechnicians, usePipelineStages } from '../../hooks/useSupabase';
import { supabase, isDemoEnvironment } from '../../lib/supabase';

// Utility function for formatting currency
const formatCurrency = (amount: number | null | undefined) => {
  if (!amount || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function Jobs() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedJob, setDraggedJob] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Customer Information
    customerName: '',
    phone: '',
    email: '',
    address: '',
    
    // Job Information
    status: 'New Lead',
    technician: '',
    partsSold: '',
    warranty: '',
    companyParts: '',
    techParts: '',
    grandTotalParts: '',
    description: '',
    leadPlatform: 'PC', // PC = Phone Call
    serviceCallFee: '',
    date: new Date().toISOString().split('T')[0],
    
    // Payment Methods (array for multiple payments)
    paymentMethods: [
      { type: 'Cash', amount: '' }
    ],
    totalAmount: ''
  });

  // Supabase hooks
  const { jobs, addJob, updateJob, refetch: refetchJobs } = useJobs();
  const { technicians } = useTechnicians();
  const { stages, loading } = usePipelineStages();

  // Auto-calculate Grand Total Parts and Total Amount
  useEffect(() => {
    const companyParts = parseFloat(formData.companyParts) || 0;
    const techParts = parseFloat(formData.techParts) || 0;
    const grandTotal = companyParts + techParts;
    setFormData(prev => ({ ...prev, grandTotalParts: grandTotal.toString() }));
  }, [formData.companyParts, formData.techParts]);

  useEffect(() => {
    const total = formData.paymentMethods.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);
    setFormData(prev => ({ ...prev, totalAmount: total.toString() }));
  }, [formData.paymentMethods]);

  const handleAddJob = () => {
    setFormData({
      // Customer Information
      customerName: '',
      phone: '',
      email: '',
      address: '',
      
      // Job Information
      status: 'New Lead',
      technician: '',
      partsSold: '',
      warranty: '',
      companyParts: '',
      techParts: '',
      grandTotalParts: '',
      description: '',
      leadPlatform: 'PC',
      serviceCallFee: '',
      date: new Date().toISOString().split('T')[0],
      
      // Payment Methods
      paymentMethods: [
        { type: 'Cash', amount: '' }
      ],
      totalAmount: ''
    });
    setSelectedJob(null);
    setShowAddModal(true);
  };

  const handleEditJob = (job: any) => {
    // Extract the raw job data from all_jobs table structure
    const rawJob = job.rawData || job;
    
    setFormData({
      // Customer Information
      customerName: rawJob['Client Name'] || job.customer?.name || '',
      phone: rawJob['Phone'] || job.customer?.phone || '',
      email: rawJob['Email'] || job.customer?.email || '',
      address: rawJob['Address'] || job.customer?.address || '',
      
      // Job Information
      status: rawJob['Status'] || job.stage?.name || 'New Lead',
      technician: rawJob['Technician'] || job.technician?.name || '',
      partsSold: rawJob['Parts Sold'] || '',
      warranty: rawJob['Warranty'] || '',
      companyParts: rawJob['Company Parts']?.toString() || '',
      techParts: rawJob['Tech Parts']?.toString() || '',
      grandTotalParts: rawJob['Total Costs']?.toString() || '',
      description: rawJob['Notes'] || job.description || '',
      leadPlatform: rawJob['LP'] || job.lead_source || 'PC',
      serviceCallFee: rawJob['Service Call Fee']?.toString() || '',
      date: rawJob['Date'] ? (() => {
        // Convert date to YYYY-MM-DD format for HTML date input
        const dateStr = rawJob['Date'];
        if (dateStr.includes('-')) {
          return dateStr.split('T')[0];
        } else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0];
      })() : new Date().toISOString().split('T')[0],
      
      // Payment Methods - convert from individual payment columns
      paymentMethods: (() => {
        const paymentMethods: { type: string; amount: string }[] = [];
        const paymentColumns = ['Cash', 'Check/Zelle', 'CC', 'CC after fee', 'Thumbtack', 'CC fee'];
        
        paymentColumns.forEach(column => {
          const rawValue = rawJob[column];
          const amount = parseFloat(String(rawValue).replace(/[^0-9.-]/g, '')) || 0;
          
          if (amount > 0) {
            paymentMethods.push({ type: column, amount: amount.toString() });
          }
        });
        
        // If no payment methods found, check if Sales amount exists and create a default
        if (paymentMethods.length === 0) {
          const salesAmount = parseFloat(String(rawJob['Sales']).replace(/[^0-9.-]/g, '')) || 0;
          if (salesAmount > 0) {
            paymentMethods.push({ type: 'Cash', amount: salesAmount.toString() });
          } else {
            paymentMethods.push({ type: 'Cash', amount: '' });
          }
        }
        
        // Additional check: if we have payment methods but they don't add up to Sales amount,
        // and Sales amount is significantly different, create a single payment method with Sales amount
        const totalFromPayments = paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
        const salesAmount = parseFloat(String(rawJob['Sales']).replace(/[^0-9.-]/g, '')) || 0;
        
        if (salesAmount > 0 && Math.abs(totalFromPayments - salesAmount) > 0.01) {
          return [{ type: 'Cash', amount: salesAmount.toString() }];
        }
        
        return paymentMethods;
      })(),
      totalAmount: (() => {
        const salesAmount = parseFloat(String(rawJob['Sales']).replace(/[^0-9.-]/g, '')) || 0;
        return salesAmount.toString();
      })()
    });
    setSelectedJob(job);
    setShowEditModal(true);
  };

  // Payment Methods Functions
  const addPaymentMethod = () => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, { type: 'Cash', amount: '' }]
    }));
  };

  const removePaymentMethod = (index: number) => {
    if (formData.paymentMethods.length > 1) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePaymentMethod = (index: number, field: 'type' | 'amount', value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((payment, i) => 
        i === index ? { ...payment, [field]: value } : payment
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isDemoEnvironment) {
        alert('Job saved successfully! (Demo Mode)');
        setShowAddModal(false);
        setShowEditModal(false);
        return;
      }

      // Calculate payment totals for each payment type
      const paymentTotals: { [key: string]: number } = {
        'Cash': 0,
        'Check/Zelle': 0,
        'CC': 0,
        'CC after fee': 0,
        'Thumbtack': 0,
        'CC fee': 0
      };

      formData.paymentMethods.forEach(payment => {
        const amount = parseFloat(payment.amount) || 0;
        if (paymentTotals.hasOwnProperty(payment.type)) {
          paymentTotals[payment.type] += amount;
        }
      });

      const jobData = {
        'Client Name': formData.customerName,
        'Phone': formData.phone,
        'Email': formData.email,
        'Address': formData.address,
        'Technician': formData.technician,
        'Status': formData.status,
        'Sales': parseFloat(formData.totalAmount) || 0,
        'Cash': paymentTotals['Cash'],
        'Check/Zelle': paymentTotals['Check/Zelle'],
        'CC': paymentTotals['CC'],
        'CC after fee': paymentTotals['CC after fee'],
        'Thumbtack': paymentTotals['Thumbtack'],
        'CC fee': paymentTotals['CC fee'],
        'LP': formData.leadPlatform,
        'Notes': formData.description,
        'Parts Sold': formData.partsSold,
        'Warranty': formData.warranty,
        'Company Parts': parseFloat(formData.companyParts) || 0,
        'Tech Parts': parseFloat(formData.techParts) || 0,
        'Total Costs': parseFloat(formData.grandTotalParts) || 0,
        'Service Call Fee': parseFloat(formData.serviceCallFee) || 0,
        'Date': formData.date,
        'Gross Profit': (parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.grandTotalParts) || 0),
        'Technician Payout': formData.technician ? (parseFloat(formData.totalAmount) || 0) * (formData.technician === 'Dan' || formData.technician === 'Ben' ? 0.5 : 0.3) : 0,
        'Company Profit': ((parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.grandTotalParts) || 0)) - (formData.technician ? (parseFloat(formData.totalAmount) || 0) * (formData.technician === 'Dan' || formData.technician === 'Ben' ? 0.5 : 0.3) : 0)
      };

      if (selectedJob) {
        await updateJob(selectedJob.id, jobData);
        setShowEditModal(false);
      } else {
        await addJob(jobData);
        setShowAddModal(false);
      }

      await refetchJobs();
      alert('Job saved successfully!');
    } catch (error: any) {
      console.error('Error saving job:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to save job: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickUpdate = async (jobId: string, field: string, value: string) => {
    try {
      const jobToUpdate = jobs?.find(job => job.id === jobId);
      if (!jobToUpdate) return;

      let updateData: any = {};
      
      if (field === 'status') {
        // Find the stage by name
        const newStage = stages?.find(stage => stage.name === value);
        if (newStage) {
          updateData = {
            'Status': value
          };
        }
      } else if (field === 'technician') {
        // Find the technician by name
        const newTech = technicians?.find(tech => tech.name === value);
        if (newTech) {
          updateData = {
            'Technician': value
          };
        }
      }

      if (Object.keys(updateData).length > 0) {
        const countId = jobToUpdate.rawData?.['Count'] || jobToUpdate.id;
        
        const { error } = await supabase
          .from('all_jobs')
          .update(updateData)
          .eq('Count', countId);

        if (error) {
          console.error('Error updating job:', error);
          alert('Failed to update job. Please try again.');
        } else {
          // Refresh the jobs list
          await refetchJobs();
        }
      }
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job? It will be moved to deleted jobs and can be recovered within 30 days.')) {
      try {
        if (isDemoEnvironment) {
          alert('Job deleted successfully! (Demo Mode)');
          return;
        }

        console.log('=== DELETE DEBUG START ===');
        console.log('Job ID to delete:', jobId);
        console.log('Job ID type:', typeof jobId);
        console.log('Current jobs before delete:', jobs?.length);
        
        // Find the job being deleted
        const jobToDelete = jobs?.find(job => job.id === jobId);
        console.log('Job to delete:', jobToDelete);
        console.log('Job Count field:', jobToDelete?.rawData?.['Count']);
        console.log('Job stage name:', jobToDelete?.stage?.name);
        console.log('Job raw data:', jobToDelete?.rawData);
        
        // Check if we're using the right ID format
        const actualCountId = jobToDelete?.rawData?.['Count'] || jobToDelete?.id;
        console.log('Using Count ID for delete:', actualCountId);

        // Soft delete: mark as deleted with timestamp
        const { error } = await supabase
          .from('all_jobs')
          .update({ 
            Status: 'Deleted'
          })
          .eq('Count', actualCountId);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Supabase update successful, refreshing jobs...');
        await refetchJobs();
        
        alert('Job deleted successfully! You can recover it from Settings > Deleted Jobs within 30 days.');
      } catch (error: any) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleDragStart = (event: any) => {
    const job = jobs.find(j => j.id === event.active.id);
    setDraggedJob(job);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over) return;

    const jobId = active.id;
    const newStageId = over.id;

    try {
      if (isDemoEnvironment) {
        alert('Job moved successfully! (Demo Mode)');
        return;
      }

      // Find the stage name from the stage ID
      const newStage = stages?.find(stage => stage.id === newStageId);
      if (!newStage) {
        console.error('Stage not found:', newStageId);
        return;
      }

      // Update the Status column instead of stage_id
      await updateJob(jobId, { Status: newStage.name });
      await refetchJobs();
    } catch (error: any) {
      console.error('Error moving job:', error);
      alert('Failed to move job. Please try again.');
    }

    setDraggedJob(null);
  };

  // Helper function to check if job should be shown (active or recently closed)
  const shouldShowJob = (job: any) => {
    const jobStatus = job.stage?.name;
    
    // Always exclude deleted jobs
    if (jobStatus === 'Deleted') return false;
    
    // For Kanban view, only show active jobs (not closed or cancelled)
    if (viewMode === 'kanban') {
      return jobStatus !== 'Closed' && jobStatus !== 'Cancelled';
    }
    
    // For table view, show all active jobs and recently closed jobs
    if (jobStatus !== 'Closed' && jobStatus !== 'Cancelled') return true;
    
    // For closed jobs, only show if they were closed this week
    if (jobStatus === 'Closed') {
      const jobDate = new Date(job.rawData?.['Date'] || job.created_at);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      return jobDate >= weekAgo;
    }
    
    return false;
  };

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = 
      job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.technician?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.stage?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || job.stage?.name === statusFilter;
    
    // Exclude deleted jobs from main view
    const isNotDeleted = job.stage?.name !== 'Deleted';
    
    // For Kanban view, exclude closed and cancelled jobs
    const isActiveJob = viewMode !== 'kanban' || 
      (job.stage?.name !== 'Closed' && job.stage?.name !== 'Cancelled');
    
    return matchesSearch && matchesStatus && shouldShowJob(job);
  }) || [];

  // Check if we should show "create new job" option
  const shouldShowCreateOption = searchTerm.trim().length > 0 && filteredJobs.length === 0;

  // Handle creating a new job with search term as customer name
  const handleCreateJobFromSearch = () => {
    setFormData({
      // Customer Information
      customerName: searchTerm.trim(),
      phone: '',
      email: '',
      address: '',
      
      // Job Information
      status: 'New Lead',
      technician: '',
      partsSold: '',
      warranty: '',
      companyParts: '',
      techParts: '',
      grandTotalParts: '',
      description: '',
      leadPlatform: 'PC',
      serviceCallFee: '',
      date: new Date().toISOString().split('T')[0],
      
      // Payment Methods
      paymentMethods: [
        { type: 'Cash', amount: '' }
      ],
      totalAmount: ''
    });
    setShowAddModal(true);
  };

  const jobsByStage = stages?.reduce((acc, stage) => {
    acc[stage.id] = filteredJobs.filter(job => job.stage?.name === stage.name);
    return acc;
  }, {} as Record<string, any[]>) || {};

  // For Kanban view, only show active stages (exclude Closed and Cancelled)
  const activeStages = viewMode === 'kanban' 
    ? stages?.filter(stage => stage.name !== 'Closed' && stage.name !== 'Cancelled')
    : stages;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Jobs Manager</h1>
          <div className="flex space-x-3">
          <Button onClick={handleAddJob}>
            <i className="ri-add-line mr-2"></i>
            Add New Job
          </Button>
        </div>
              </div>
              
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-table-line mr-2"></i>
              Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-layout-column-line mr-2"></i>
              Kanban
              </button>
            </div>
          </div>

        {/* Filters */}
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Statuses</option>
                  {(viewMode === 'kanban' ? activeStages : stages)?.map(stage => (
                    <option key={stage.id} value={stage.name}>{stage.name}</option>
                  ))}
                </select>
                </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
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

        {/* Jobs Display */}
        {viewMode === 'table' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.customer?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{job.customer?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={job.technician?.name || ''}
                          onChange={(e) => handleQuickUpdate(job.id, 'technician', e.target.value)}
                          className="text-sm border border-gray-300 rounded px-3 py-1 bg-white min-w-[140px] hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        >
                          <option value="">Select Technician</option>
                          {technicians?.map((tech) => (
                            <option key={tech.id} value={tech.name}>
                              {tech.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={job.stage?.name || ''}
                          onChange={(e) => handleQuickUpdate(job.id, 'status', e.target.value)}
                          className="text-sm border border-gray-300 rounded px-3 py-1 bg-white min-w-[140px] hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          style={{
                            backgroundColor: job.stage?.color + '10', 
                            color: job.stage?.color,
                            borderColor: job.stage?.color + '40'
                          }}
                        >
                          {stages?.map((stage) => (
                            <option key={stage.id} value={stage.name}>
                              {stage.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(job.estimated_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.due_date ? new Date(job.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditJob(job)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Show "Create New Job" option when search returns no results */}
                  {shouldShowCreateOption && (
                    <tr className="bg-blue-50 border-2 border-dashed border-blue-300">
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="text-center">
                            <i className="ri-user-add-line text-4xl text-blue-500 mb-2"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              No jobs found for "{searchTerm}"
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Would you like to create a new job for this customer?
                            </p>
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              onClick={handleCreateJobFromSearch}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                            >
                              <i className="ri-add-line mr-2"></i>
                              Create New Job for "{searchTerm}"
                            </Button>
                            <Button
                              onClick={() => setSearchTerm('')}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2"
                            >
                              <i className="ri-close-line mr-2"></i>
                              Clear Search
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {viewMode === 'kanban' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <i className="ri-information-line text-blue-500 mr-2"></i>
              <span className="text-sm text-blue-700">
                Kanban view shows only active jobs. Closed and cancelled jobs are hidden.
              </span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {/* Debug: Total jobs: {jobs?.length || 0}, Filtered jobs: {filteredJobs?.length || 0}, Active stages: {activeStages?.length || 0} */}
            </div>
          </div>
        )}

        {viewMode === 'kanban' && (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {activeStages?.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  jobs={jobsByStage[stage.id] || []}
                  onEdit={handleEditJob}
                  onDelete={handleDeleteJob}
                  technicians={technicians}
                  stages={activeStages}
                  onQuickUpdate={handleQuickUpdate}
                />
              ))}
              
              {/* Show "Create New Job" option when search returns no results */}
              {shouldShowCreateOption && (
                <div className="min-w-[300px] bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6">
                  <div className="text-center">
                    <i className="ri-user-add-line text-4xl text-blue-500 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No jobs found for "{searchTerm}"
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create a new job for this customer?
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={handleCreateJobFromSearch}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Create Job for "{searchTerm}"
                      </Button>
                      <Button
                        onClick={() => setSearchTerm('')}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2"
                      >
                        <i className="ri-close-line mr-2"></i>
                        Clear Search
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DragOverlay>
              {draggedJob ? (
                <KanbanJobCard job={draggedJob} isDragging={true} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add/Edit Modal - WhatsApp Style */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                  {selectedJob ? 'Edit Job' : 'Add New Job'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                    className="text-white hover:text-gray-200 transition-colors"
                >
                    <i className="ri-close-line text-xl"></i>
                </button>
                </div>
              </div>
              
              {/* Form Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Job Information Section - Moved to Top */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-tools-line mr-2 text-green-500"></i>
                      Job Information
                    </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {stages?.map(stage => (
                            <option key={stage.id} value={stage.name}>{stage.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tech</label>
                        <select
                          value={formData.technician}
                          onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select Technician</option>
                          {technicians?.map(tech => (
                            <option key={tech.id} value={tech.name}>{tech.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-user-line mr-2 text-blue-500"></i>
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Customer name"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Phone number"
                      />
                    </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Email address"
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Customer address"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Job Details Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-settings-3-line mr-2 text-purple-500"></i>
                      Additional Job Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parts Sold</label>
                    <textarea
                          value={formData.partsSold}
                          onChange={(e) => setFormData({ ...formData, partsSold: e.target.value })}
                      rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Describe parts sold"
                    />
                  </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Warranty</label>
                        <input
                          type="text"
                          value={formData.warranty}
                          onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Warranty information"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Parts</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.companyParts}
                          onChange={(e) => setFormData({ ...formData, companyParts: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tech Parts</label>
                      <input
                        type="number"
                        step="0.01"
                          value={formData.techParts}
                          onChange={(e) => setFormData({ ...formData, techParts: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grand Total Parts</label>
                        <input
                          type="text"
                          value={formatCurrency(parseFloat(formData.grandTotalParts))}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Job description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LP (Lead Platform)</label>
                      <select 
                          value={formData.leadPlatform}
                          onChange={(e) => setFormData({ ...formData, leadPlatform: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="PC">PC - Phone Call</option>
                          <option value="TT">TT - Thumbtack</option>
                          <option value="AG">AG - Angie's List</option>
                          <option value="RF">RF - Referral</option>
                          <option value="FD">FD - Facebook</option>
                          <option value="WS">WS - Website</option>
                          <option value="YP">YP - Yellow Pages</option>
                          <option value="EL">EL - Email</option>
                          <option value="DN">DN - Door to Door</option>
                          <option value="FB">FB - Facebook</option>
                          <option value="GG">GG - Google</option>
                          <option value="CB">CB - Craigslist</option>
                          <option value="AV">AV - Angie's List</option>
                          <option value="BN">BN - Banner</option>
                          <option value="ND">ND - Nextdoor</option>
                          <option value="VP">VP - Valpak</option>
                          <option value="NOI">NOI - No Info</option>
                          <option value="LGP">LGP - Local Google</option>
                      </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Call Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.serviceCallFee}
                          onChange={(e) => setFormData({ ...formData, serviceCallFee: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-money-dollar-circle-line mr-2 text-purple-500"></i>
                      Payment Methods
                    </h3>
                    
                    {formData.paymentMethods.map((payment, index) => (
                      <div key={index} className="flex items-center gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                      <select 
                            value={payment.type}
                            onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Check/Zelle">Check/Zelle</option>
                            <option value="CC">Credit Card</option>
                            <option value="CC after fee">CC after fee</option>
                            <option value="Thumbtack">Thumbtack</option>
                            <option value="CC fee">CC fee</option>
                      </select>
                    </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={payment.amount}
                            onChange={(e) => updatePaymentMethod(index, 'amount', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                  </div>
                        {formData.paymentMethods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePaymentMethod(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <i className="ri-delete-bin-line text-xl"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addPaymentMethod}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Add Another Payment Method
                    </button>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">{formatCurrency(parseFloat(formData.totalAmount))}</span>
                      </div>
                  </div>
                </div>
                
                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6">
                  <Button 
                      type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                  >
                    Cancel
                  </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                    {isSubmitting ? (
                        <span className="flex items-center">
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <i className="ri-save-line mr-2"></i>
                          {selectedJob ? 'Update Job' : 'Add Job'}
                        </span>
                    )}
                  </Button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Kanban Column Component
function KanbanColumn({ 
  stage, 
  jobs, 
  onEdit, 
  onDelete,
  technicians,
  stages,
  onQuickUpdate
}: { 
  stage: any; 
  jobs: any[]; 
  onEdit: (job: any) => void;
  onDelete: (jobId: string) => void;
  technicians?: any[];
  stages?: any[];
  onQuickUpdate?: (jobId: string, field: string, value: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-50 rounded-lg p-4 h-full">
        {/* Stage Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: stage.color }}
            ></div>
            <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          </div>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {jobs.length}
          </span>
        </div>

        {/* Jobs List */}
        <div 
          ref={setNodeRef}
          className={`space-y-3 min-h-[200px] ${
            isOver ? 'bg-blue-50' : ''
          }`}
        >
          <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
            {jobs.map((job) => (
              <KanbanJobCard 
                key={job.id} 
                job={job} 
                onEdit={onEdit}
                onDelete={onDelete}
                technicians={technicians}
                stages={stages}
                onQuickUpdate={onQuickUpdate}
              />
            ))}
          </SortableContext>
          
          {jobs.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No jobs in this stage
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Kanban Job Card Component
function KanbanJobCard({ 
  job, 
  isDragging = false, 
  onEdit, 
  onDelete,
  technicians,
  stages,
  onQuickUpdate
}: { 
  job: any; 
  isDragging?: boolean; 
  onEdit?: (job: any) => void;
  onDelete?: (jobId: string) => void;
  technicians?: any[];
  stages?: any[];
  onQuickUpdate?: (jobId: string, field: string, value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: job.id,
    data: {
      type: 'job',
      job,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="space-y-2">
        {/* Customer Name */}
        <h4 className="font-medium text-gray-900 text-sm">
            {job.customer?.name || 'Unknown Customer'}
          </h4>

        {/* Quick Edit - Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status:</span>
          <select
            value={job.stage?.name || ''}
            onChange={(e) => onQuickUpdate?.(job.id, 'status', e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {stages?.map((stage) => (
              <option key={stage.id} value={stage.name}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Edit - Technician */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Tech:</span>
          <select
            value={job.technician?.name || ''}
            onChange={(e) => onQuickUpdate?.(job.id, 'technician', e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Select Tech</option>
            {technicians?.map((tech) => (
              <option key={tech.id} value={tech.name}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        {job.estimated_price && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estimated:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(job.estimated_price)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(job);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit Job"
              >
                <i className="ri-edit-line text-sm"></i>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Job"
              >
                <i className="ri-delete-bin-line text-sm"></i>
              </button>
            )}
          </div>
      </div>
    </div>
  );
}