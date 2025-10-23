import { useState, useEffect } from 'react';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { useJobs, useTechnicians } from '../../hooks/useSupabase';

export default function Schedule() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'daily' | 'timeline' | 'map'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    technician: '',
    job: '',
    startTime: '',
    endTime: '',
    date: '',
    notes: ''
  });

  const { jobs, loading: jobsLoading } = useJobs();
  const { technicians, loading: techLoading } = useTechnicians();

  // Get jobs with scheduled times and locations (enhanced mock data)
  const scheduledJobs = jobs.map((job, index) => ({
    ...job,
    scheduledDate: job.due_date || job.created_at,
    startTime: `${9 + (index % 8)}:00`, // Mock start time between 9-16
    endTime: `${10 + (index % 8)}:00`,  // Mock end time (1 hour duration)
    duration: 1,                         // Duration in hours
    location: {
      address: job.customer?.address || `${100 + index} Main St, City, State`,
      lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Mock coordinates around NYC
      lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      city: 'New York',
      state: 'NY'
    }
  }));

  // Filter jobs by selected technician
  const filteredJobs = selectedTechnician === 'all' 
    ? scheduledJobs 
    : scheduledJobs.filter(job => job.technician?.name === selectedTechnician);

  // Group jobs by date
  const jobsByDate = filteredJobs.reduce((acc, job) => {
    const date = new Date(job.scheduledDate).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(job);
    return acc;
  }, {} as Record<string, typeof scheduledJobs>);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getJobsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return jobsByDate[dateString] || [];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAddSchedule = () => {
    setFormData({
      technician: '',
      job: '',
      startTime: '',
      endTime: '',
      date: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement schedule creation
    console.log('Creating schedule:', formData);
    setShowAddModal(false);
  };

  if (jobsLoading || techLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-blue-500 animate-spin mb-4"></i>
            <p className="text-gray-600">Loading schedule...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600 mt-1">Manage technician schedules and job assignments</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
              <i className="ri-calendar-today-line mr-2"></i>
              Today
            </Button>
            <Button onClick={handleAddSchedule}>
              <i className="ri-add-line mr-2"></i>
              Schedule Job
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Technician:</label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Technicians</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.name}>{tech.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Calendar View"
              >
                <i className="ri-calendar-line"></i>
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`p-2 rounded-md ${viewMode === 'daily' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Daily View"
              >
                <i className="ri-calendar-schedule-line"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="List View"
              >
                <i className="ri-list-check"></i>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-md ${viewMode === 'timeline' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Timeline View"
              >
                <i className="ri-timeline-line"></i>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Map View"
              >
                <i className="ri-map-line"></i>
              </button>
            </div>
          </div>
        </Card>

        {/* Calendar View */}
        {viewMode === 'calendar' ? (
          <Card>
            <div className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="h-24"></div>;
                  }

                  const dayJobs = getJobsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={index}
                      className={`h-24 p-1 border border-gray-200 ${
                        isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                      } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayJobs.slice(0, 2).map((job, jobIndex) => (
                          <div
                            key={jobIndex}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                            title={`${job.customer?.name} - ${job.description}`}
                          >
                            {job.customer?.name}
                          </div>
                        ))}
                        {dayJobs.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayJobs.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : viewMode === 'daily' ? (
          /* Daily View */
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Daily Schedule - {currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-arrow-left-line"></i>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </div>

              {/* Time slots */}
              <div className="space-y-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = 8 + i;
                  const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                  const jobsInSlot = filteredJobs.filter(job => {
                    const jobDate = new Date(job.scheduledDate).toDateString();
                    const currentDateStr = currentDate.toDateString();
                    return jobDate === currentDateStr && job.startTime === timeSlot;
                  });

                  return (
                    <div key={timeSlot} className="flex items-center space-x-4 py-2 border-b border-gray-100">
                      <div className="w-16 text-sm font-medium text-gray-600">
                        {timeSlot}
                      </div>
                      <div className="flex-1">
                        {jobsInSlot.length > 0 ? (
                          <div className="space-y-2">
                            {jobsInSlot.map((job) => (
                              <div key={job.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{job.customer?.name}</h4>
                                      <p className="text-sm text-gray-600">{job.description}</p>
                                      <p className="text-xs text-gray-500">{job.location?.address}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {job.technician?.name || 'Unassigned'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {job.startTime} - {job.endTime}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">No jobs scheduled</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : viewMode === 'timeline' ? (
          /* Timeline View */
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Technician Timeline</h2>
                <div className="text-sm text-gray-500">
                  {filteredJobs.length} jobs scheduled
                </div>
              </div>

              <div className="space-y-6">
                {technicians.map(tech => {
                  const techJobs = filteredJobs.filter(job => job.technician?.name === tech.name);
                  
                  return (
                    <div key={tech.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="ri-user-line text-blue-600"></i>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                            <p className="text-sm text-gray-500">{techJobs.length} jobs scheduled</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {techJobs.length > 0 ? `${formatTime(techJobs[0]?.startTime)} - ${formatTime(techJobs[techJobs.length - 1]?.endTime)}` : 'No jobs'}
                          </div>
                          <div className="text-xs text-gray-500">Total hours: {techJobs.reduce((sum, job) => sum + (job.duration || 1), 0)}</div>
                        </div>
                      </div>

                      {techJobs.length > 0 ? (
                        <div className="relative">
                          {/* Timeline */}
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                          
                          <div className="space-y-4">
                            {techJobs.map((job, index) => (
                              <div key={job.id} className="relative flex items-start space-x-4">
                                {/* Timeline dot */}
                                <div className="relative z-10 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                  <i className="ri-calendar-line text-white text-xs"></i>
                                </div>
                                
                                {/* Job content */}
                                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{job.customer?.name}</h4>
                                    <div className="text-sm text-gray-500">
                                      {formatTime(job.startTime)} - {formatTime(job.endTime)}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="flex items-center space-x-1">
                                      <i className="ri-map-pin-line"></i>
                                      <span>{job.location?.address}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <i className="ri-time-line"></i>
                                      <span>{job.duration || 1}h duration</span>
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      job.status === 'New Lead' ? 'bg-blue-100 text-blue-800' :
                                      job.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                      job.status === 'Closed' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {job.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <i className="ri-calendar-line text-4xl mb-2"></i>
                          <p>No jobs scheduled for {tech.name}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : viewMode === 'map' ? (
          /* Map View */
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Locations Map</h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {filteredJobs.length} jobs scheduled
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Active Leads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">In Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                </div>
              </div>

              {/* Google Maps Container */}
              <div className="relative bg-gray-100 rounded-lg h-96 overflow-hidden">
                <div id="map" className="w-full h-full"></div>
                
                {/* Fallback for when Google Maps is not available */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <div className="text-center">
                    <i className="ri-map-line text-6xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Google Maps Integration</h3>
                    <p className="text-gray-600 mb-4">To enable Google Maps, add your API key to the configuration</p>
                    <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
                      <h4 className="font-medium text-gray-900 mb-2">Active Leads Locations:</h4>
                      <div className="space-y-2 text-sm">
                        {filteredJobs.filter(job => job.status === 'New Lead').map((job, index) => (
                          <div key={job.id} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-gray-700">{job.customer?.name}</span>
                            <span className="text-gray-500">- {job.location?.address}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job List Below Map */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduled Jobs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{job.customer?.name}</h4>
                          <p className="text-sm text-gray-600">{job.description}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                          job.status === 'New Lead' ? 'bg-red-500' :
                          job.status === 'In Progress' ? 'bg-blue-500' :
                          job.status === 'Closed' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center space-x-1">
                          <i className="ri-map-pin-line"></i>
                          <span>{job.location?.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <i className="ri-time-line"></i>
                          <span>{job.startTime} - {job.endTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <i className="ri-user-line"></i>
                          <span>{job.technician?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* List View */
          <div className="space-y-4">
            {Object.entries(jobsByDate)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([date, jobs]) => (
                <Card key={date}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <span className="text-sm text-gray-500">{jobs.length} jobs</span>
                    </div>
                    
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <div>
                                <h4 className="font-medium text-gray-900">{job.customer?.name}</h4>
                                <p className="text-sm text-gray-600">{job.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {job.technician?.name || 'Unassigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(job.startTime)} - {formatTime(job.endTime)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* Add Schedule Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Schedule Job</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmitSchedule} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technician *
                    </label>
                    <select
                      value={formData.technician}
                      onChange={(e) => setFormData(prev => ({ ...prev, technician: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Technician</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.name}>{tech.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job *
                    </label>
                    <select
                      value={formData.job}
                      onChange={(e) => setFormData(prev => ({ ...prev, job: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Job</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.customer?.name} - {job.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Schedule Job
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
