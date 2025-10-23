// Add this to any component to debug data sources
// Example: Add to Jobs Manager page

import { useEffect } from 'react';
import { useJobs } from '../../hooks/useSupabase';

export default function JobsManager() {
  const { jobs, loading } = useJobs();

  // Debug: Log raw data from database
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      console.log('=== DATABASE DATA DEBUG ===');
      console.log('Table: all_jobs');
      console.log('Total records:', jobs.length);
      console.log('Sample record:', jobs[0]);
      console.log('Customer Name field:', jobs[0]?.customer?.name);
      console.log('Job ID field:', jobs[0]?.id);
      console.log('Raw database data:', jobs[0]?.rawData);
      console.log('========================');
    }
  }, [jobs]);

  // Rest of your component...
}
