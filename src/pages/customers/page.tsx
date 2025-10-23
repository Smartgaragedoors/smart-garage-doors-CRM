import { useState, useEffect } from 'react';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useCustomers, useJobs } from '../../hooks/useSupabase';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit3, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Star,
  Activity,
  Users,
  Briefcase,
  ArrowUpRight,
  Grid3X3,
  List,
  Package,
  X,
  Circle
} from 'lucide-react';

// Utility function for formatting currency
const formatCurrency = (amount: number | null | undefined) => {
  if (!amount || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Utility function for formatting dates
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

// Utility function for relative time
const getRelativeTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  } catch {
    return 'N/A';
  }
};

// Status badge component with enhanced styling
const StatusBadge = ({ status, size = 'sm' }: { status: string, size?: 'sm' | 'md' | 'lg' }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'closed':
      case 'completed':
      case 'finished':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle,
          dot: 'bg-emerald-500'
        };
      case 'in progress':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          dot: 'bg-blue-500'
        };
      case 'new lead':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Star,
          dot: 'bg-purple-500'
        };
      case 'follow up':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Bell,
          dot: 'bg-amber-500'
        };
      case 'awaiting parts':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Package,
          dot: 'bg-orange-500'
        };
      case 'pending payment':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          dot: 'bg-red-500'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: X,
          dot: 'bg-gray-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Circle,
          dot: 'bg-gray-500'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium border ${config.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`}></div>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
};

// Enhanced Customer Card Component
const CustomerCard = ({ customer, onSelect, onEdit, onQuickAction }: { 
  customer: any, 
  onSelect: (customer: any) => void,
  onEdit: (customer: any) => void,
  onQuickAction: (action: string, customer: any) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const totalJobs = customer.locations?.reduce((sum: number, location: any) => 
    sum + (location.jobs?.length || 0), 0) || 0;
  
  const activeJobs = customer.locations?.reduce((sum: number, location: any) => 
    sum + (location.jobs?.filter((job: any) => 
      !['Closed', 'Completed', 'Finished', 'Cancelled'].includes(job.status)
    ).length || 0), 0) || 0;

  const recentJobs = customer.locations?.flatMap((location: any) => 
    location.jobs || []
  ).sort((a: any, b: any) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime()).slice(0, 5);

  const lastJobDate = recentJobs?.[0]?.date;
  const isRecentCustomer = lastJobDate && new Date(lastJobDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <Card className="mb-4 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 group">
      <div className="p-6">
        {/* Enhanced Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              {isRecentCustomer && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900 truncate">{customer.name}</h3>
                {isRecentCustomer && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Recent
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                {customer.phone && (
                  <button 
                    onClick={() => copyToClipboard(customer.phone)}
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors group/phone"
                    title="Click to copy"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                    <Copy className="w-3 h-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                  </button>
                )}
                {customer.email && (
                  <button 
                    onClick={() => copyToClipboard(customer.email)}
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors group/email truncate"
                    title="Click to copy"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                    <Copy className="w-3 h-3 opacity-0 group-hover/email:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3 h-3" />
                  <span>{totalJobs} jobs</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{activeJobs} active</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{customer.locations?.length || 0} locations</span>
                </span>
                {lastJobDate && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{getRelativeTime(lastJobDate)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(customer.total_revenue)}</div>
              <div className="text-sm text-green-600 font-medium">{formatCurrency(customer.total_profit)} profit</div>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="relative">
                <Button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {showQuickActions && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[160px]">
                    <button
                      onClick={() => onQuickAction('call', customer)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={() => onQuickAction('email', customer)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => onQuickAction('schedule', customer)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Schedule</span>
                    </button>
                    <div className="border-t my-1"></div>
                    <button
                      onClick={() => onEdit(customer)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onSelect(customer)}
              variant="outline"
              size="sm"
              className="text-sm h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
            <Button
              onClick={() => onQuickAction('jobs', customer)}
              variant="outline"
              size="sm"
              className="text-sm h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Activity className="w-4 h-4 mr-1" />
              Jobs ({totalJobs})
            </Button>
            <Button
              onClick={() => onQuickAction('locations', customer)}
              variant="outline"
              size="sm"
              className="text-sm h-8 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Locations ({customer.locations?.length || 0})
            </Button>
            <Button
              onClick={() => onQuickAction('schedule', customer)}
              variant="outline"
              size="sm"
              className="text-sm h-8 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Activity</div>
              <div className="text-sm font-medium text-gray-900">
                {lastJobDate ? getRelativeTime(lastJobDate) : 'No activity'}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Expandable Content */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            {/* Recent Jobs with Enhanced Display */}
            {recentJobs && recentJobs.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Recent Jobs
                  </h4>
                  <Button
                    onClick={() => onSelect(customer)}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 text-blue-600 hover:text-blue-800"
                  >
                    View All Jobs
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentJobs.map((job: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={job.status} size="sm" />
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(job.sales)}</div>
                        <div className="text-xs text-gray-500">{formatDate(job.date)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">
                          {job.technician_name?.split(',').map((t: string) => t.trim()).join(', ')}
                        </div>
                        {job.address && (
                          <Button
                            onClick={() => openGoogleMaps(job.address)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                            title="View on Google Maps"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locations with Enhanced Display */}
            {customer.locations && customer.locations.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                    Locations
                  </h4>
                  <Button
                    onClick={() => onSelect(customer)}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 text-purple-600 hover:text-purple-800"
                  >
                    View All Locations
                  </Button>
                </div>
                <div className="space-y-2">
                  {customer.locations.slice(0, 3).map((location: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {location.address || `Location ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {location.jobs?.length || 0} jobs
                        </span>
                        {location.address && (
                          <Button
                            onClick={() => openGoogleMaps(location.address)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-purple-600"
                            title="View on Google Maps"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {customer.locations.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      +{customer.locations.length - 3} more locations
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Financial Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-600 font-medium text-sm">Total Revenue</div>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{formatCurrency(customer.total_revenue)}</div>
                <div className="text-xs text-blue-700 mt-1">From {totalJobs} jobs</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-green-600 font-medium text-sm">Total Profit</div>
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">{formatCurrency(customer.total_profit)}</div>
                <div className="text-xs text-green-700 mt-1">{activeJobs} active jobs</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Enhanced Edit Customer Modal
const EditCustomerModal = ({ 
  customer, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  customer: any, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: any) => void 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Customer</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Customer name"
              required
              className="h-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              className="h-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
              type="email"
              className="h-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Customer notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="h-10">
              Cancel
            </Button>
            <Button type="submit" className="h-10 bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterLeadPlatform, setFilterLeadPlatform] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const { customers, loading, updateCustomer } = useCustomers();

  // Lead platform abbreviations
  const leadPlatforms = {
    'TT': 'Thumbtack',
    'AG': 'Angies',
    'NX': 'Networx',
    'RF': 'Referral',
    'FD': 'Friend',
    'PC': 'Past Customer',
    'WS': 'Website',
    'YP': 'Yelp',
    'EL': 'Eliya',
    'DN': 'Dan',
    'FB': 'Facebook',
    'GG': 'Google',
    'CB': 'CallBack',
    'AV': 'Avi',
    '?': 'Unknown',
    'BN': 'Ben',
    'ND': 'Next Door',
    'VP': 'Valpak',
    'NOI': 'Knock on Door',
    'LGP': 'Lead Gen Pro'
  };

  // Get unique technicians and lead platforms from all jobs
  const allTechnicians = Array.from(new Set(
    customers.flatMap(customer => 
      customer.locations?.flatMap(location => 
        location.jobs?.map(job => job.technician_name?.split(',')).flat() || []
      ) || []
    )
  )).filter(Boolean);

  const allLeadPlatforms = Array.from(new Set(
    customers.flatMap(customer => 
      customer.locations?.flatMap(location => 
        location.jobs?.map(job => job.lp).filter(Boolean) || []
      ) || []
    )
  ));

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      customer.locations?.some(location => 
        location.jobs?.some(job => job.status === filterStatus)
      );
    
    const matchesType = filterType === 'all' || 
      (filterType === 'active' && customer.locations?.some(location => 
        location.jobs?.some(job => !['Closed', 'Completed', 'Finished', 'Cancelled'].includes(job.status))
      )) ||
      (filterType === 'completed' && customer.locations?.some(location => 
        location.jobs?.some(job => ['Closed', 'Completed', 'Finished'].includes(job.status))
      ));
    
    const matchesLeadPlatform = filterLeadPlatform === 'all' || 
      customer.locations?.some(location => 
        location.jobs?.some(job => job.lp === filterLeadPlatform)
      );
    
    const matchesTechnician = filterTechnician === 'all' || 
      customer.locations?.some(location => 
        location.jobs?.some(job => 
          job.technician_name?.split(',').map(t => t.trim()).includes(filterTechnician)
        )
      );
    
    return matchesSearch && matchesStatus && matchesType && matchesLeadPlatform && matchesTechnician;
  });

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };

  const handleSaveCustomer = async (data: any) => {
    try {
      await updateCustomer(editingCustomer.id, data);
      window.location.reload();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer. Please try again.');
    }
  };

  const handleQuickAction = (action: string, customer: any) => {
    switch (action) {
      case 'call':
        if (customer.phone) {
          window.open(`tel:${customer.phone}`, '_self');
        }
        break;
      case 'email':
        if (customer.email) {
          window.open(`mailto:${customer.email}`, '_self');
        }
        break;
      case 'schedule':
        // Navigate to schedule page with customer pre-selected
        window.location.href = `/schedule?customer=${encodeURIComponent(customer.name)}`;
        break;
      case 'jobs':
        setSelectedCustomer(customer);
        // Could open a jobs modal or navigate to jobs page
        break;
      case 'locations':
        setSelectedCustomer(customer);
        // Could open a locations modal
        break;
    }
  };

  const exportToExcel = () => {
    const exportData = customers.map(customer => ({
      'Customer Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email,
      'Total Revenue': customer.total_revenue,
      'Total Profit': customer.total_profit,
      'Total Jobs': customer.locations?.reduce((sum: number, location: any) => 
        sum + (location.jobs?.length || 0), 0) || 0,
      'Active Jobs': customer.locations?.reduce((sum: number, location: any) => 
        sum + (location.jobs?.filter((job: any) => 
          !['Closed', 'Completed', 'Finished', 'Cancelled'].includes(job.status)
        ).length || 0), 0) || 0,
      'Locations': customer.locations?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customers.xlsx');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
              <p className="text-gray-600">Your central hub for customer relationships and job tracking</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </Button>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              {/* Enhanced Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search customers, phone numbers, or emails..."
                    className="pl-12 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                  >
                    <option value="all">All Status</option>
                    <option value="New Lead">New Lead</option>
                    <option value="Follow up">Follow up</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Parts">Awaiting Parts</option>
                    <option value="Pending Payment">Pending Payment</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                >
                  <option value="all">All Types</option>
                  <option value="active">Active Jobs</option>
                  <option value="completed">Completed Jobs</option>
                </select>

                <select
                  value={filterLeadPlatform}
                  onChange={(e) => setFilterLeadPlatform(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                >
                  <option value="all">All Platforms</option>
                  {allLeadPlatforms.map(platform => (
                    <option key={platform} value={platform}>
                      {platform} {leadPlatforms[platform as keyof typeof leadPlatforms] && `(${leadPlatforms[platform as keyof typeof leadPlatforms]})`}
                    </option>
                  ))}
                </select>

                <select
                  value={filterTechnician}
                  onChange={(e) => setFilterTechnician(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                >
                  <option value="all">All Technicians</option>
                  {allTechnicians.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-900">{customers.length}</p>
                <p className="text-xs text-blue-700">{filteredCustomers.length} filtered</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.total_revenue || 0), 0))}
                </p>
                <p className="text-xs text-green-700">All time</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Profit</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.total_profit || 0), 0))}
                </p>
                <p className="text-xs text-purple-700">Net profit</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Active Jobs</p>
                <p className="text-2xl font-bold text-orange-900">
                  {customers.reduce((sum, c) => 
                    sum + (c.locations?.reduce((locSum: number, location: any) => 
                      locSum + (location.jobs?.filter((job: any) => 
                        !['Closed', 'Completed', 'Finished', 'Cancelled'].includes(job.status)
                      ).length || 0), 0) || 0), 0)}
                </p>
                <p className="text-xs text-orange-700">In progress</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Customer List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Users className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Customer
              </Button>
            </Card>
          ) : (
            filteredCustomers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onSelect={setSelectedCustomer}
                onEdit={handleEditCustomer}
                onQuickAction={handleQuickAction}
              />
            ))
          )}
        </div>
      </div>

      {/* Enhanced Edit Customer Modal */}
      <EditCustomerModal
        customer={editingCustomer}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />
    </Layout>
  );
}