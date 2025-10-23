import { useEffect, useState } from 'react';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import { useJobs, useCustomers } from '../../hooks/useSupabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#3B82F6', '#F97316', '#10B981', '#F59E0B', '#EF4444'];

export default function Home() {
  const { jobs } = useJobs();
  const { customers } = useCustomers();
  const [leadPlatformAnalytics, setLeadPlatformAnalytics] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'week'>('all');
  const [metricFilter, setMetricFilter] = useState<'jobs' | 'revenue' | 'profit' | 'costs'>('jobs');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

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

  // Calculate lead platform analytics from customers data
  useEffect(() => {
    if (customers.length > 0) {
      const platformStats: any = {};
      
      customers.forEach(customer => {
        customer.locations?.forEach(location => {
          location.jobs?.forEach(job => {
            const platform = job.lp || 'Unknown';
            const platformName = leadPlatforms[platform as keyof typeof leadPlatforms] || platform;
            
            if (!platformStats[platformName]) {
              platformStats[platformName] = { count: 0, revenue: 0 };
            }
            
            platformStats[platformName].count++;
            platformStats[platformName].revenue += parseFloat(String(job.sales).replace(/[^0-9.-]/g, '')) || 0;
          });
        });
      });
      
      setLeadPlatformAnalytics(platformStats);
    }
  }, [customers]);

  // Filter jobs by time period
  const filterJobsByTimePeriod = (jobs: any[]) => {
    const now = new Date();
    
    switch (timeFilter) {
      case 'year':
        return jobs.filter(job => {
          const jobDate = new Date(job.created_at);
          return jobDate.getFullYear() === selectedYear;
        });
      case 'month':
        return jobs.filter(job => {
          const jobDate = new Date(job.created_at);
          return jobDate.getFullYear() === selectedYear && jobDate.getMonth() === selectedMonth - 1;
        });
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return jobs.filter(job => new Date(job.created_at) >= weekStart);
      default:
        return jobs;
    }
  };

  // Extract all jobs from customers data
  const allJobs = customers.flatMap(customer => 
    customer.locations?.flatMap(location => 
      location.jobs?.map(job => ({
        ...job,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email
      })) || []
    ) || []
  );

  const filteredJobs = filterJobsByTimePeriod(allJobs);

  // Calculate metrics from filtered jobs
  const filteredMetrics = {
    jobs: filteredJobs.length,
    revenue: filteredJobs.reduce((sum, job) => sum + (parseFloat(String(job.sales).replace(/[^0-9.-]/g, '')) || 0), 0),
    profit: filteredJobs.reduce((sum, job) => sum + (parseFloat(String(job.gross_profit).replace(/[^0-9.-]/g, '')) || 0), 0),
    costs: filteredJobs.reduce((sum, job) => sum + (parseFloat(String(job.total_costs).replace(/[^0-9.-]/g, '')) || 0), 0)
  };

  // Calculate lead platform stats for filtered jobs
  const filteredLeadPlatformStats: any = {};
  filteredJobs.forEach(job => {
    const platform = job.lp || 'Unknown';
    const platformName = leadPlatforms[platform as keyof typeof leadPlatforms] || platform;
    
    if (!filteredLeadPlatformStats[platformName]) {
      filteredLeadPlatformStats[platformName] = { count: 0, revenue: 0 };
    }
    
    filteredLeadPlatformStats[platformName].count++;
    filteredLeadPlatformStats[platformName].revenue += parseFloat(String(job.sales).replace(/[^0-9.-]/g, '')) || 0;
  });

  // Calculate technician data from actual job data
  const technicianData = (() => {
    const techStats: any = {};
    
    customers.forEach(customer => {
      customer.locations?.forEach(location => {
        location.jobs?.forEach(job => {
          // Handle multiple technicians (comma-separated)
          const technicians = job.technician_name?.split(',').map(t => t.trim()).filter(Boolean) || [];
          
          technicians.forEach(tech => {
            if (!techStats[tech]) {
              techStats[tech] = {
                jobs: 0,
                revenue: 0,
                commission: 0,
                profit: 0,
                costs: 0
              };
            }
            
            // Split revenue and costs among technicians
            const techCount = technicians.length;
            techStats[tech].jobs += 1 / techCount; // Fractional jobs for multiple techs
            techStats[tech].revenue += (parseFloat(String(job.sales).replace(/[^0-9.-]/g, '')) || 0) / techCount;
            techStats[tech].profit += (parseFloat(String(job.gross_profit).replace(/[^0-9.-]/g, '')) || 0) / techCount;
            techStats[tech].costs += (parseFloat(String(job.total_costs).replace(/[^0-9.-]/g, '')) || 0) / techCount;
          });
        });
      });
    });

    // Calculate commissions (assuming different rates for owners vs technicians)
    Object.keys(techStats).forEach(tech => {
      const stats = techStats[tech];
      // Dan and Ben are owners, others are technicians
      if (tech === 'Dan' || tech === 'Ben') {
        stats.commission = stats.revenue * 0.5; // 50% for owners
      } else {
        stats.commission = stats.revenue * 0.3; // 30% for technicians
      }
    });

    return Object.entries(techStats).map(([name, data]: [string, any]) => ({
      name,
      jobs: Math.round(data.jobs * 10) / 10, // Round to 1 decimal
      revenue: Math.round(data.revenue),
      commission: Math.round(data.commission),
      profit: Math.round(data.profit),
      costs: Math.round(data.costs)
    })).sort((a, b) => b.revenue - a.revenue);
  })();

  // Monthly jobs trend data
  const monthlyJobsData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ month, jobs: 0, revenue: 0 }));
    
    filteredJobs.forEach(job => {
      const jobDate = new Date(job.created_at);
      const monthIndex = jobDate.getMonth();
      monthlyData[monthIndex].jobs++;
      monthlyData[monthIndex].revenue += parseFloat(String(job.sales).replace(/[^0-9.-]/g, '')) || 0;
    });
    
    return monthlyData;
  })();

  // Monthly revenue data
  const monthlyRevenueData = monthlyJobsData.map(item => ({
    month: item.month,
    revenue: item.revenue
  }));

  // Lead sources data for pie chart
  const leadSourcesData = Object.entries(filteredLeadPlatformStats).map(([name, data]: [string, any]) => ({
    name,
    value: data.count,
    revenue: data.revenue,
    percentage: ((data.count / filteredJobs.length) * 100).toFixed(1)
  })).sort((a, b) => b.value - a.value);

  // Calculate totals for all time
  const totalRevenueAllTime = customers.reduce((sum, customer) => sum + (parseFloat(String(customer.total_revenue).replace(/[^0-9.-]/g, '')) || 0), 0);
  const totalCostsAllTime = customers.reduce((sum, customer) => sum + (parseFloat(String(customer.total_costs).replace(/[^0-9.-]/g, '')) || 0), 0);
  const totalProfitAllTime = customers.reduce((sum, customer) => sum + (parseFloat(String(customer.total_profit).replace(/[^0-9.-]/g, '')) || 0), 0);

  // Current period metrics
  const currentJobs = filteredMetrics.jobs;
  const currentRevenue = filteredMetrics.revenue;
  const currentProfit = filteredMetrics.profit;
  const currentCosts = filteredMetrics.costs;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Business Dashboard
              </h1>
              <p className="text-slate-300 text-lg">
                Real-time insights and analytics for your garage door service business
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-4">
              {/* Time Period Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
              
              {/* Year Filter */}
              {timeFilter === 'year' || timeFilter === 'month' ? (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              ) : null}
              
              {/* Month Filter */}
              {timeFilter === 'month' ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              ) : null}
              
              {/* Primary Metric Filter */}
              <select
                value={metricFilter}
                onChange={(e) => setMetricFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
              >
                <option value="jobs">Jobs</option>
                <option value="revenue">Revenue</option>
                <option value="profit">Profit</option>
                <option value="costs">Costs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-white">{currentJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-briefcase-line text-2xl text-blue-400"></i>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Total Costs</p>
                  <p className="text-3xl font-bold text-white">${currentCosts.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-2xl text-red-400"></i>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">${currentRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-trending-up-line text-2xl text-green-400"></i>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Total Profit</p>
                  <p className="text-3xl font-bold text-white">${currentProfit.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-line-chart-line text-2xl text-purple-400"></i>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Active Leads</p>
                  <p className="text-3xl font-bold text-white">
                    {allJobs.filter(job => job.status === 'New Lead').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-user-add-line text-2xl text-yellow-400"></i>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Pending Payments</p>
                  <p className="text-3xl font-bold text-white">
                    {allJobs.filter(job => job.status === 'Pending Payment').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-time-line text-2xl text-orange-400"></i>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Avg Job Value</p>
                  <p className="text-3xl font-bold text-white">
                    ${currentJobs > 0 ? Math.round(currentRevenue / currentJobs) : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-bar-chart-line text-2xl text-indigo-400"></i>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-700/40 to-slate-800/50 backdrop-blur-sm border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Profit Margin</p>
                  <p className="text-3xl font-bold text-white">
                    {currentRevenue > 0 ? Math.round((currentProfit / currentRevenue) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-percent-line text-2xl text-emerald-400"></i>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Jobs Trend */}
          <Card title="Monthly Jobs Trend" className="bg-white/95 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyJobsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }} 
                />
                <Bar dataKey="jobs" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Lead Sources */}
          <Card title="Lead Sources" className="bg-white/95 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Technician Performance */}
        <Card title="Technician Performance" className="bg-white/95 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Technician</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Jobs</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Commission</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Profit</th>
                </tr>
              </thead>
              <tbody>
                {technicianData.map((tech: any, index: number) => (
                  <tr key={tech.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {tech.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{tech.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{tech.jobs}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">${tech.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-blue-600 font-semibold">${tech.commission.toLocaleString()}</td>
                    <td className="py-3 px-4 text-purple-600 font-semibold">${tech.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Revenue Trend */}
        <Card title="Revenue Trend" className="bg-white/95 backdrop-blur-sm">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </Layout>
  );
}