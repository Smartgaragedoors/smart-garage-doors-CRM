import React, { useState, useEffect } from 'react';
import Layout from '../../components/feature/Layout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { Settings } from 'lucide-react';
import { useJobs, useTechnicians } from '../../hooks/useSupabase';

// Color schemes for technicians
const technicianColors = [
  { color: 'bg-blue-500', textColor: 'text-blue-600', borderColor: 'border-blue-200', bgColor: 'bg-blue-50' },
  { color: 'bg-amber-600', textColor: 'text-amber-600', borderColor: 'border-amber-200', bgColor: 'bg-amber-50' },
  { color: 'bg-purple-500', textColor: 'text-purple-600', borderColor: 'border-purple-200', bgColor: 'bg-purple-50' },
  { color: 'bg-green-500', textColor: 'text-green-600', borderColor: 'border-green-200', bgColor: 'bg-green-50' },
  { color: 'bg-red-500', textColor: 'text-red-600', borderColor: 'border-red-200', bgColor: 'bg-red-50' },
  { color: 'bg-indigo-500', textColor: 'text-indigo-600', borderColor: 'border-indigo-200', bgColor: 'bg-indigo-50' },
  { color: 'bg-pink-500', textColor: 'text-pink-600', borderColor: 'border-pink-200', bgColor: 'bg-pink-50' },
  { color: 'bg-teal-500', textColor: 'text-teal-600', borderColor: 'border-teal-200', bgColor: 'bg-teal-50' }
];

// Time slots from 9 AM to 5 PM
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function Dispatching() {
  const [viewMode, setViewMode] = useState<'calendar' | 'map'>('calendar');
  const [colorBy, setColorBy] = useState('Employee');
  const [weekView, setWeekView] = useState('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get real data from hooks
  const { jobs, loading: jobsLoading } = useJobs();
  const { technicians, loading: techniciansLoading } = useTechnicians();

  // Process technicians with colors
  const processedTechnicians = technicians?.map((tech, index) => ({
    ...tech,
    initials: tech.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    ...technicianColors[index % technicianColors.length]
  })) || [];

  // Filter jobs for today and active statuses
  const todayJobs = jobs?.filter(job => {
    const jobDate = new Date(job.rawData?.['Date'] || job.created_at);
    const today = new Date();
    const isToday = jobDate.toDateString() === today.toDateString();
    const isActive = job.stage?.name && !['Closed', 'Cancelled', 'Deleted'].includes(job.stage.name);
    return isToday && isActive;
  }) || [];

  // Calculate job position and width
  const getJobPosition = (startTime: string, endTime: string) => {
    const startIndex = timeSlots.indexOf(startTime);
    const endIndex = timeSlots.indexOf(endTime);
    const duration = endIndex - startIndex;
    
    return {
      left: `${(startIndex / timeSlots.length) * 100}%`,
      width: `${(duration / timeSlots.length) * 100}%`
    };
  };

  // Get technician by ID
  const getTechnician = (techId: string) => {
    return processedTechnicians.find(tech => tech.id === techId);
  };

  // Get jobs for a specific technician
  const getJobsForTechnician = (techId: string) => {
    return todayJobs.filter(job => job.technician?.id === techId);
  };

  // Generate mock times for jobs that don't have them
  const generateJobTimes = (job: any, index: number) => {
    const startHour = 9 + (index % 8);
    const startMinute = (index % 2) * 30;
    const endHour = startHour + 1;
    const endMinute = startMinute;
    
    return {
      startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
      endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
    };
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Show loading state
  if (jobsLoading || techniciansLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dispatching data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-semibold text-gray-900">Dispatching</h1>
              
              {/* Date Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Today
                </Button>
                <Button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                <span className="text-lg font-medium text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Toggles */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'calendar' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Calendar
                </Button>
                <Button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'map' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map
                </Button>
              </div>

              {/* Dropdowns */}
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
              >
                <option value="Employee">Color by Employee</option>
                <option value="Status">Color by Status</option>
              </select>

              <select
                value={weekView}
                onChange={(e) => setWeekView(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
              >
                <option value="Week">Week</option>
                <option value="Month">Month</option>
              </select>

              <Button className="p-2 hover:bg-gray-100 rounded">
                <Settings className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 mx-6">
          <div className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> Jobs: {jobs?.length || 0}, Technicians: {technicians?.length || 0}, Today Jobs: {todayJobs?.length || 0}
          </div>
        </div> */}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'calendar' ? (
            <>
              {/* Technician Sidebar */}
              <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Technicians</h3>
                </div>
                <div className="space-y-1 p-2">
                  {processedTechnicians.map((tech) => (
                    <div
                      key={tech.id}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-full ${tech.color} flex items-center justify-center text-white text-xs font-semibold mr-3`}>
                        {tech.initials}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Grid */}
              <div className="flex-1 overflow-auto">
                <div className="relative">
                  {/* Time Headers */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                    <div className="flex">
                      <div className="w-64 p-4 border-r border-gray-200">
                        <span className="text-sm font-medium text-gray-500">Time</span>
                      </div>
                      {timeSlots.map((time) => (
                        <div key={time} className="flex-1 p-4 text-center border-r border-gray-200 last:border-r-0">
                          <span className="text-xs text-gray-500">{formatTime(time)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technician Rows */}
                  <div className="space-y-1">
                    {processedTechnicians.map((tech) => {
                      const techJobs = getJobsForTechnician(tech.id);
                      return (
                        <div key={tech.id} className="flex min-h-[60px] bg-white border-b border-gray-100">
                          {/* Technician Info */}
                          <div className="w-64 p-4 border-r border-gray-200 flex items-center">
                            <div className={`w-8 h-8 rounded-full ${tech.color} flex items-center justify-center text-white text-xs font-semibold mr-3`}>
                              {tech.initials}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{tech.name}</span>
                          </div>

                          {/* Job Timeline */}
                          <div className="flex-1 relative">
                            {techJobs.map((job, index) => {
                              const times = generateJobTimes(job, index);
                              const position = getJobPosition(times.startTime, times.endTime);
                              return (
                                <div
                                  key={job.id}
                                  className={`absolute top-2 h-8 ${tech.bgColor} ${tech.borderColor} border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow`}
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    minWidth: '120px'
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                      {job.customer?.name || 'Unknown Customer'}
                                    </span>
                                    <div className={`w-4 h-4 rounded-full ${tech.color} flex items-center justify-center text-white text-xs ml-2 flex-shrink-0`}>
                                      {tech.initials}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Map View Placeholder */
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Map View</h3>
                <p className="text-gray-500">Map view coming soon...</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Responsive List View */}
        <div className="lg:hidden bg-white border-t border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Jobs</h3>
          <div className="space-y-3">
            {todayJobs.map((job, index) => {
              const tech = getTechnician(job.technician?.id);
              const times = generateJobTimes(job, index);
              return (
                <div
                  key={job.id}
                  className={`p-4 ${tech?.bgColor || 'bg-gray-50'} ${tech?.borderColor || 'border-gray-200'} border rounded-xl shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${tech?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-semibold mr-3`}>
                        {tech?.initials || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{job.customer?.name || 'Unknown Customer'}</div>
                        <div className="text-sm text-gray-600">{tech?.name || 'Unknown Tech'}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(times.startTime)} - {formatTime(times.endTime)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{job.notes || 'No notes'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}