
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { useCompany, useTechnicians, usePipelineStages, useFormFields, useSettings, useDeletedJobs } from '../../hooks/useSupabase';
import { supabase, isDemoEnvironment } from '../../lib/supabase';
import PermissionsTab from './components/PermissionsTab';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Supabase hooks
  const { company, updateCompany } = useCompany();
  const { technicians, updateTechnician } = useTechnicians();
  const { stages, updateStage, addStage, deleteStage } = usePipelineStages();
  const { formFields, updateFormField, addFormField, deleteFormField, reorderFormFields } = useFormFields();
  const { settings, updateSetting } = useSettings();
  const { deletedJobs, loading: deletedJobsLoading, refetch: refetchDeletedJobs } = useDeletedJobs();

  // Deleted jobs functions
  const handleRecoverJob = async (jobId: string) => {
    try {
      if (isDemoEnvironment) {
        alert('Job recovered successfully! (Demo Mode)');
        return;
      }

      console.log('=== RECOVERY DEBUG START ===');
      console.log('Recovering job with ID:', jobId);
      console.log('Job ID type:', typeof jobId);
      
      // Find the job being recovered to get the correct Count ID
      const jobToRecover = deletedJobs?.find(job => job.id === jobId);
      console.log('Job to recover:', jobToRecover);
      console.log('Job Count field:', jobToRecover?.rawData?.['Count']);
      
      // Use the actual Count ID for the update
      const actualCountId = jobToRecover?.rawData?.['Count'] || jobToRecover?.id;
      console.log('Using Count ID for recovery:', actualCountId);

      const { error } = await supabase
        .from('all_jobs')
        .update({ 
          Status: 'New Lead'
        })
        .eq('Count', actualCountId);

      if (error) {
        console.error('Supabase recovery error:', error);
        throw error;
      }

      console.log('Supabase update successful, refreshing deleted jobs...');

      await refetchDeletedJobs();
      console.log('=== RECOVERY DEBUG END ===');
      alert('Job recovered successfully!');
    } catch (error: any) {
      console.error('Error recovering job:', error);
      alert('Failed to recover job. Please try again.');
    }
  };

  const handlePermanentDelete = async (jobId: string) => {
    if (confirm('Are you sure you want to permanently delete this job? This action cannot be undone.')) {
      try {
        if (isDemoEnvironment) {
          alert('Job permanently deleted! (Demo Mode)');
          return;
        }

        await supabase
          .from('all_jobs')
          .delete()
          .eq('Count', jobId);

        await refetchDeletedJobs();
        alert('Job permanently deleted!');
      } catch (error: any) {
        console.error('Error permanently deleting job:', error);
        alert('Failed to permanently delete job. Please try again.');
      }
    }
  };

  const getDaysUntilPermanentDeletion = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const thirtyDaysLater = new Date(deletedDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysLeft = Math.ceil((thirtyDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  // Local state for form data
  const [companyData, setCompanyData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false
  });

  const [kanbanFields, setKanbanFields] = useState([
    { id: 1, name: 'customerName', label: 'Customer Name', enabled: true },
    { id: 2, name: 'issue', label: 'Issue', enabled: true },
    { id: 3, name: 'technician', label: 'Technician', enabled: true },
    { id: 4, name: 'price', label: 'Price', enabled: true },
    { id: 5, name: 'dueDate', label: 'Due Date', enabled: false },
    { id: 6, name: 'leadSource', label: 'Lead Source', enabled: false },
  ]);

  const tabs = [
    { id: 'general', label: 'General', icon: 'ri-settings-line' },
    { id: 'forms', label: 'Form Fields', icon: 'ri-file-list-line' },
    { id: 'kanban', label: 'Kanban Cards', icon: 'ri-kanban-view' },
    { id: 'pipeline', label: 'Pipeline Stages', icon: 'ri-flow-chart' },
    { id: 'permissions', label: 'Access Control', icon: 'ri-shield-user-line' },
    { id: 'commissions', label: 'Commissions', icon: 'ri-money-dollar-circle-line' },
    { id: 'import', label: 'CSV Import', icon: 'ri-file-upload-line' },
    { id: 'deleted-jobs', label: 'Deleted Jobs', icon: 'ri-delete-bin-line' },
  ];

  // Load company data when available
  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name || '',
        phone: company.phone || '',
        address: company.address || '',
        email: company.email || ''
      });
    }
  }, [company]);

  // Load notification settings
  useEffect(() => {
    if (settings.notifications) {
      setNotificationSettings(settings.notifications);
    }
  }, [settings]);

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const saveCompanyInfo = async () => {
    try {
      setSaveStatus('saving');
      await updateCompany(companyData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaveStatus('saving');
      await updateSetting('notifications', notificationSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveFormConfiguration = async () => {
    setSaveStatus('saving');
    try {
      // Form fields are automatically saved through the useFormFields hook
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const savePipelineSettings = async () => {
    try {
      setSaveStatus('saving');
      // Pipeline stages are automatically saved through the usePipelineStages hook
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveCommissionRates = async () => {
    try {
      setSaveStatus('saving');
      // Commission rates are automatically saved through the updateTechnician calls
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const addNewField = async () => {
    const maxOrder = Math.max(...formFields.map(f => f.order_position), 0);
    const newField = {
      name: `customField${formFields.length + 1}`,
      label: 'New Field',
      type: 'text',
      required: false,
      order_position: maxOrder + 1,
    };
    await addFormField(newField);
  };

  const removeField = async (fieldId: string) => {
    await deleteFormField(fieldId);
  };

  const updateField = async (fieldId: string, updates: any) => {
    await updateFormField(fieldId, updates);
  };

  const moveFieldUp = async (index: number) => {
    if (index > 0) {
      const newFields = [...formFields];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      await reorderFormFields(newFields);
    }
  };

  const moveFieldDown = async (index: number) => {
    if (index < formFields.length - 1) {
      const newFields = [...formFields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      await reorderFormFields(newFields);
    }
  };

  const addNewStage = async () => {
    const maxOrder = Math.max(...stages.map(s => s.order_position), 0);
    const newStage = {
      name: 'New Stage',
      color: '#6B7280',
      order_position: maxOrder + 1,
    };
    await addStage(newStage);
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <i className="ri-loader-4-line mr-2 animate-spin"></i>
            Saving...
          </>
        );
      case 'saved':
        return (
          <>
            <i className="ri-check-line mr-2"></i>
            Saved Successfully
          </>
        );
      case 'error':
        return (
          <>
            <i className="ri-error-warning-line mr-2"></i>
            Save Failed
          </>
        );
      default:
        return 'Save Changes';
    }
  };

  const getSaveButtonClass = () => {
    switch (saveStatus) {
      case 'saved':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`${tab.icon} mr-3`}></i>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card title="Company Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={companyData.address}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={saveCompanyInfo}
                      disabled={saveStatus === 'saving'}
                      className={getSaveButtonClass()}
                    >
                      {getSaveButtonText()}
                    </Button>
                  </div>
                </Card>

                <Card title="Notification Settings">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive email alerts for new jobs and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={saveNotificationSettings}
                      disabled={saveStatus === 'saving'}
                      className={getSaveButtonClass()}
                    >
                      {getSaveButtonText()}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'forms' && (
              <Card title="Lead Intake Form Configuration">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Configure fields for the lead intake form. Drag to reorder fields.</p>
                    <Button onClick={addNewField} variant="secondary">
                      <i className="ri-add-line mr-2"></i>
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formFields.map((field, index) => (
                      <div key={field.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(field.id, { type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="number">Number</option>
                              <option value="textarea">Textarea</option>
                              <option value="select">Select</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Required</span>
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => moveFieldUp(index)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              disabled={index === 0}
                            >
                              <i className="ri-arrow-up-line"></i>
                            </button>
                            <button
                              onClick={() => moveFieldDown(index)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              disabled={index === formFields.length - 1}
                            >
                              <i className="ri-arrow-down-line"></i>
                            </button>
                            <button
                              onClick={() => removeField(field.id)}
                              className="p-2 text-red-400 hover:text-red-600"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                        
                        {field.type === 'select' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                            <textarea
                              value={field.options?.join('\n') || ''}
                              onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(opt => opt.trim()) })}
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button 
                      onClick={saveFormConfiguration}
                      disabled={saveStatus === 'saving'}
                      className={getSaveButtonClass()}
                    >
                      {getSaveButtonText()}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'kanban' && (
              <Card title="Kanban Card Display">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Choose which fields to display on Kanban cards.</p>
                  
                  <div className="space-y-3">
                    {kanbanFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{field.label}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={field.enabled}
                            onChange={() => setKanbanFields(fields =>
                              fields.map(f => f.id === field.id ? { ...f, enabled: !f.enabled } : f)
                            )}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => updateSetting('kanbanFields', kanbanFields)}
                      disabled={saveStatus === 'saving'}
                      className={getSaveButtonClass()}
                    >
                      {getSaveButtonText()}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'pipeline' && (
              <Card title="Pipeline Stages">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Customize your pipeline stages and their colors.</p>
                  
                  <div className="space-y-3">
                    {stages.map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          ></div>
                          <input
                            type="text"
                            value={stage.name}
                            onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                            className="font-medium text-gray-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={stage.color}
                            onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                            className="w-8 h-8 rounded border border-gray-300"
                          />
                          <button 
                            onClick={() => deleteStage(stage.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="secondary" onClick={addNewStage}>
                      <i className="ri-add-line mr-2"></i>
                      Add Stage
                    </Button>
                    <Button 
                      onClick={savePipelineSettings}
                      disabled={saveStatus === 'saving'}
                      className={getSaveButtonClass()}
                    >
                      {getSaveButtonText()}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'permissions' && (
              <PermissionsTab />
            )}

            {activeTab === 'commissions' && (
              <Card title="Commission Rates">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Set commission rates for each technician.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Technician
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Commission Rate (%)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {technicians.map((technician) => (
                          <tr key={technician.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {technician.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={technician.commission_rate}
                                onChange={(e) => updateTechnician(technician.id, { commission_rate: parseFloat(e.target.value) })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="ml-1 text-sm text-gray-500">%</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button className="text-red-600 hover:text-red-900">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={saveCommissionRates}
                      disabled={saveStatus === 'saving'}
                      className={getSaveButtonClass()}
                    >
                      {getSaveButtonText()}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'import' && (
              <div className="space-y-6">
                <Card title="CSV Import - Closed Jobs">
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <i className="ri-information-line text-blue-500 mt-0.5 mr-3"></i>
                        <div>
                          <h4 className="font-medium text-blue-900">Import Historical Data</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Upload a CSV file containing all your closed jobs from previous systems. This will help populate your dashboard with historical data and analytics.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select CSV File
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <i className="ri-file-upload-line text-4xl text-gray-400 mb-4"></i>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Drop your CSV file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Supports CSV files up to 50MB with closed job data
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          id="csv-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log('CSV file selected:', file.name);
                              // Handle CSV file processing
                            }
                          }}
                        />
                        <label
                          htmlFor="csv-upload"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                        >
                          <i className="ri-upload-line mr-2"></i>
                          Choose File
                        </label>
                      </div>
                    </div>

                    {/* Sample CSV Format */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Required CSV Format</h4>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-700">customer_name</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">customer_phone</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">customer_email</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">job_title</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">job_description</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">technician_name</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">final_price</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">completion_date</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-gray-600">
                              <td className="py-2 px-3">John Smith</td>
                              <td className="py-2 px-3">(555) 123-4567</td>
                              <td className="py-2 px-3">john@email.com</td>
                              <td className="py-2 px-3">AC Repair</td>
                              <td className="py-2 px-3">Fixed cooling unit</td>
                              <td className="py-2 px-3">Mike Johnson</td>
                              <td className="py-2 px-3">450.00</td>
                              <td className="py-2 px-3">2024-01-15</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        * All columns are required. Dates should be in YYYY-MM-DD format.
                      </p>
                    </div>

                    {/* Column Mapping */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Column Mapping</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Map your CSV columns to the system fields. This helps ensure data is imported correctly.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="customer_name">customer_name</option>
                            <option value="client_name">client_name</option>
                            <option value="name">name</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="customer_phone">customer_phone</option>
                            <option value="phone">phone</option>
                            <option value="contact_number">contact_number</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="customer_email">customer_email</option>
                            <option value="email">email</option>
                            <option value="contact_email">contact_email</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="job_title">job_title</option>
                            <option value="service_type">service_type</option>
                            <option value="title">title</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="job_description">job_description</option>
                            <option value="description">description</option>
                            <option value="notes">notes</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Technician Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="technician_name">technician_name</option>
                            <option value="assigned_to">assigned_to</option>
                            <option value="worker">worker</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Final Price Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="final_price">final_price</option>
                            <option value="total_amount">total_amount</option>
                            <option value="price">price</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date Column</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="completion_date">completion_date</option>
                            <option value="date_completed">date_completed</option>
                            <option value="finished_date">finished_date</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Import Options */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Import Options</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-sm text-gray-700">Create new customers if they don't exist</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-sm text-gray-700">Create new technicians if they don't exist</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" />
                          <span className="text-sm text-gray-700">Skip duplicate jobs (based on customer + date)</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-3" defaultChecked />
                          <span className="text-sm text-gray-700">Mark all imported jobs as "Closed"</span>
                        </label>
                      </div>
                    </div>

                    {/* Import Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        <i className="ri-information-line mr-1"></i>
                        Preview your data before importing to ensure accuracy
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="secondary">
                          <i className="ri-eye-line mr-2"></i>
                          Preview Data
                        </Button>
                        <Button>
                          <i className="ri-download-line mr-2"></i>
                          Import Jobs
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Import History */}
                <Card title="Import History">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Track your previous CSV imports and their status.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Import Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              File Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Records Imported
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              2024-01-20 14:30
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              closed_jobs_2023.csv
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              1,247 jobs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i className="ri-check-line mr-1"></i>
                                Completed
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">View Details</button>
                              <button className="text-red-600 hover:text-red-900">Rollback</button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={5}>
                              No previous imports found
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'deleted-jobs' && (
              <div className="space-y-6">
                <Card title="Deleted Jobs Management">
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <i className="ri-information-line text-yellow-500 mt-0.5 mr-3"></i>
                        <div>
                          <h4 className="font-medium text-yellow-900">Deleted Jobs Recovery</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Jobs are kept in the deleted state for 30 days before being permanently removed. You can recover them during this period.
                          </p>
                        </div>
                      </div>
                    </div>

                    {deletedJobsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading deleted jobs...</span>
                      </div>
                    ) : deletedJobs.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="ri-delete-bin-line text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600">No deleted jobs found.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deletedJobs.map((job: any) => {
                          const daysLeft = getDaysUntilPermanentDeletion(job.deleted_at || job.rawData?.deleted_at);
                          const isExpired = daysLeft === 0;
                          
                          return (
                            <div key={job.id} className={`border rounded-lg p-4 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <h3 className="font-medium text-gray-900">
                                        {job.customer?.name || job.rawData?.['Client Name'] || 'Unknown Customer'}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        Job #{job.id} • {job.rawData?.['Parts Sold'] || 'No description'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Deleted: {new Date(job.deleted_at || job.rawData?.deleted_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-gray-900">
                                        ${parseFloat(String(job.rawData?.['Sales'] || 0).replace(/[^0-9.-]/g, '')).toFixed(2)}
                                      </p>
                                      <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                        {isExpired ? 'Expired - Will be permanently deleted' : `${daysLeft} days left`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                  <Button
                                    onClick={() => handleRecoverJob(job.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
                                    disabled={isExpired}
                                  >
                                    <i className="ri-refresh-line mr-1"></i>
                                    Recover
                                  </Button>
                                  <Button
                                    onClick={() => handlePermanentDelete(job.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                                  >
                                    <i className="ri-delete-bin-line mr-1"></i>
                                    Delete Forever
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
