import { useState, useEffect } from 'react';
import { supabase, isDemoEnvironment, type Company, type Technician, type PipelineStage, type Job, type FormField, type Setting } from '../lib/supabase';

// Company hooks
export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        // Mock company data for demo
        setCompany({
          id: 'demo-company',
          name: 'Smart Garage CRM Demo',
          phone: '(555) 123-4567',
          address: '123 Demo Street, Demo City, DC 12345',
          email: 'demo@smartgarage.com',
          website: 'https://demo.smartgarage.com',
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    try {
      if (!company) return;
      
      if (isDemoEnvironment) {
        // Mock update for demo
        setCompany({ ...company, ...updates, updated_at: new Date().toISOString() });
        return { data: company, error: null };
      }
      
      const { data, error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', company.id)
        .select()
        .single();

      if (error) throw error;
      setCompany(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { company, loading, error, updateCompany, refetch: fetchCompany };
}

// Enhanced Customer Management hooks
export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        // Enhanced mock data with multiple locations
        const mockCustomers = [
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '(555) 123-4567',
            primary_address: '123 Main Street, Springfield, IL 62701',
            customer_type: 'residential',
            status: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            locations: [
              {
                id: '1-1',
                location_name: 'Primary Residence',
                address: '123 Main Street, Springfield, IL 62701',
                state: 'IL',
                is_primary: true,
                jobs: [
                  { id: '1', title: 'Garage door opener repair', status: 'Closed', actual_price: 450, created_at: '2024-01-15' },
                  { id: '2', title: 'Spring replacement', status: 'Closed', actual_price: 320, created_at: '2024-02-10' }
                ]
              }
            ],
            total_jobs: 2,
            total_spent: 770,
            total_revenue: 770,
            last_job_date: '2024-02-10',
            first_job_date: '2024-01-15',
            completed_jobs: 2,
            cancelled_jobs: 0,
            tags: ['Repeat Customer', 'High Value']
          },
          {
            id: '2',
            name: 'Maria Garcia',
            email: 'maria.garcia@email.com',
            phone: '(555) 234-5678',
            primary_address: '456 Pine Avenue, Springfield, IL 62702',
            customer_type: 'residential',
            status: 'active',
            created_at: '2024-01-05',
            updated_at: '2024-01-05',
            locations: [
              {
                id: '2-1',
                location_name: 'Primary Residence',
                address: '456 Pine Avenue, Springfield, IL 62702',
                state: 'IL',
                is_primary: true,
                jobs: [
                  { id: '3', title: 'Door installation', status: 'Closed', actual_price: 1200, created_at: '2024-01-20' }
                ]
              }
            ],
            total_jobs: 1,
            total_spent: 1200,
            total_revenue: 1200,
            last_job_date: '2024-01-20',
            first_job_date: '2024-01-20',
            completed_jobs: 1,
            cancelled_jobs: 0,
            tags: ['VIP']
          },
          {
            id: '3',
            name: 'ABC Property Management',
            email: 'contact@abcproperties.com',
            phone: '(555) 345-6789',
            primary_address: '789 Business Blvd, Springfield, IL 62703',
            customer_type: 'commercial',
            status: 'active',
            created_at: '2024-01-10',
            updated_at: '2024-01-10',
            locations: [
              {
                id: '3-1',
                location_name: 'Office Building',
                address: '789 Business Blvd, Springfield, IL 62703',
                state: 'IL',
                is_primary: true,
                jobs: [
                  { id: '4', title: 'Maintenance check', status: 'Closed', actual_price: 150, created_at: '2024-01-25' },
                  { id: '5', title: 'Door repair', status: 'Closed', actual_price: 280, created_at: '2024-02-05' }
                ]
              }
            ],
            total_jobs: 2,
            total_spent: 430,
            total_revenue: 430,
            last_job_date: '2024-02-05',
            first_job_date: '2024-01-25',
            completed_jobs: 2,
            cancelled_jobs: 0,
            tags: ['Commercial', 'Property Manager']
          }
        ];
        setCustomers(mockCustomers);
        return;
      }

      // Fetch all jobs from your custom all_jobs table
      const { data: jobsData, error } = await supabase
        .from('all_jobs')
        .select('*');

      if (error) {
        console.error('Error fetching from all_jobs table:', error);
        throw error;
      }

      // Sort by any date field that exists
      if (jobsData && jobsData.length > 0) {
        const firstJob = jobsData[0];
        const dateFields = Object.keys(firstJob).filter(key =>
          key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('time') ||
          key.toLowerCase().includes('created') ||
          key.toLowerCase().includes('updated')
        );

        // Sort by Count field (ID) for most recent first
        jobsData.sort((a, b) => {
          // Extract numeric part from Count field for consistent sorting
          const extractNumeric = (countStr: string) => {
            if (!countStr) return 0;
            // Remove any non-numeric characters and convert to number
            const numericPart = countStr.replace(/[^0-9]/g, '');
            return parseInt(numericPart) || 0;
          };
          
          const countA = extractNumeric(a['Count']);
          const countB = extractNumeric(b['Count']);
          return countB - countA; // Most recent first (higher Count = newer)
        });
      }

      // Group jobs by customer to create customer records
      const customerMap = new Map();

      jobsData?.forEach((job: any) => {
        // Find any date field for created_at
        const dateFields = Object.keys(job).filter(key =>
          key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('time') ||
          key.toLowerCase().includes('created') ||
          key.toLowerCase().includes('updated')
        );
        const jobDate = dateFields.length > 0 ? job[dateFields[0]] : new Date().toISOString();

        // Map to your actual all_jobs table fields
        const customerName = job['Client Name'] || 'Unknown Customer';
        const customerEmail = job['Email'] || '';
        const customerPhone = job['Phone'] || '';
        const customerAddress = job['Address'] || '';

        // Use customer name as the key
        const customerKey = customerName;

        if (!customerMap.has(customerKey)) {
          // Create new customer record using your actual fields
          customerMap.set(customerKey, {
            id: customerKey,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            primary_address: customerAddress,
            customer_type: 'residential', // Default type
            status: 'active', // Default status
            created_at: jobDate,
            updated_at: jobDate,
            locations: new Map(),
            total_jobs: 0,
            total_spent: 0,
            completed_jobs: 0,
            cancelled_jobs: 0,
            tags: [],
            // Additional fields from your all_jobs table
            state: job['State'] || '',
            notes: job['Notes'] || '',
            total_revenue: 0,
            total_costs: 0,
            total_profit: 0,
            technician_payouts: 0,
            company_profit: 0
          });
        }

        const customer = customerMap.get(customerKey);

        // Create location key based on address
        const locationKey = job['Address'] || 'Unknown Location';

        if (!customer.locations.has(locationKey)) {
          customer.locations.set(locationKey, {
            id: `${customerKey}-${locationKey}`,
            location_name: 'Primary Location',
            address: job['Address'] || 'Unknown Address',
            state: job['State'] || '',
            is_primary: true,
            jobs: []
          });
        }

        const location = customer.locations.get(locationKey);

        // Map to your actual all_jobs table fields
        const jobTitle = job['Parts Sold'] || 'Untitled Job';
        const jobDescription = job['Parts Sold'] || '';
        const jobStatus = job['Status'] || 'Unknown';
        const jobPrice = Number(job['Sales']) || Number(job['Total Costs']) || 0;
        const estimatedPrice = Number(job['Sales']) || 0;
        const jobPriority = 'medium'; // Default since not in your fields
        const leadSource = job['Thumbtack'] ? 'Thumbtack' : 'Other';
        const dueDate = job['Date'] || '';
        const technician = job['Technician'] || '';
        const jobNotes = job['Notes'] || '';

        // Add job to location with your actual field mapping
        location.jobs.push({
          id: job['Count'] || job.id || Math.random().toString(),
          title: jobTitle,
          description: jobDescription,
          status: jobStatus,
          actual_price: jobPrice,
          estimated_price: estimatedPrice,
          priority: jobPriority,
          lead_source: leadSource,
          due_date: dueDate,
          notes: jobNotes,
          created_at: jobDate,
          technician: technician,
          stage: jobStatus,
          // Financial fields from your all_jobs table
          technician_name: job['Technician'] || '',
          cash: job['Cash'] || 0,
          check_zelle: job['Check/Zelle'] || 0,
          credit_card: job['CC'] || 0,
          cc_after_fee: job['CC after fee'] || 0,
          thumbtack: job['Thumbtack'] || 0,
          sales: job['Sales'] || 0,
          company_parts: job['Company Parts'] || 0,
          tech_parts: job['Tech Parts'] || 0,
          sales_tax: job['Sales tax'] || 0,
          cc_fee: job['CC fee'] || 0,
          total_costs: job['Total Costs'] || 0,
          tips_to_technician: job['Tips to Technician'] || 0,
          gross_profit: job['Gross Profit'] || 0,
          payout_rate: job['Payout Rate'] || 0,
          technician_payout: job['Technician Payout'] || 0,
          dan_payout: job['Dan Payout'] || 0,
          ben_payout: job['Ben Payout'] || 0,
          company_profit: job['Company Profit'] || 0,
          balance: job['Balance'] || 0,
          job_commission_to_other: job['job comission to other'] || 0,
          // month: job['Month'] || '', // Column deleted from all_jobs table
          // week: job['Week'] || '', // Column deleted from all_jobs table
          date: job['Date'] || '',
          lp: job['LP'] || ''
        });

        // Update customer totals using your actual field mapping
        customer.total_jobs++;
        
        // Use consistent sales value for all calculations - ensure proper number conversion
        const salesAmount = parseFloat(String(job['Sales']).replace(/[^0-9.-]/g, '')) || 0;
        
        // Update financial totals - only count revenue from closed jobs
        // Check for various closed status variations
        const isClosedJob = jobStatus === 'Closed' || 
                           jobStatus === 'Completed' || 
                           jobStatus === 'Finished' ||
                           jobStatus?.toLowerCase().includes('closed') ||
                           jobStatus?.toLowerCase().includes('completed') ||
                           jobStatus?.toLowerCase().includes('finished');
                           
        if (isClosedJob) {
          // Calculate total revenue from all payment methods
          const cashAmount = parseFloat(String(job['Cash']).replace(/[^0-9.-]/g, '')) || 0;
          const checkZelleAmount = parseFloat(String(job['Check/Zelle']).replace(/[^0-9.-]/g, '')) || 0;
          const ccAmount = parseFloat(String(job['CC']).replace(/[^0-9.-]/g, '')) || 0;
          const ccAfterFeeAmount = parseFloat(String(job['CC after fee']).replace(/[^0-9.-]/g, '')) || 0;
          const thumbtackAmount = parseFloat(String(job['Thumbtack']).replace(/[^0-9.-]/g, '')) || 0;
          const ccFeeAmount = parseFloat(String(job['CC fee']).replace(/[^0-9.-]/g, '')) || 0;
          
          // Sum all payment methods for total revenue
          const totalRevenueFromPayments = cashAmount + checkZelleAmount + ccAmount + ccAfterFeeAmount + thumbtackAmount + ccFeeAmount;
          
          // Fallback to Sales field if payment methods don't add up
          const salesAmountNum = parseFloat(String(job['Sales']).replace(/[^0-9.-]/g, '')) || 0;
          const actualRevenue = totalRevenueFromPayments > 0 ? totalRevenueFromPayments : salesAmountNum;
          
          const totalCostsNum = parseFloat(String(job['Total Costs']).replace(/[^0-9.-]/g, '')) || 0;
          const grossProfitNum = parseFloat(String(job['Gross Profit']).replace(/[^0-9.-]/g, '')) || 0;
          const technicianPayoutNum = parseFloat(String(job['Technician Payout']).replace(/[^0-9.-]/g, '')) || 0;
          const companyProfitNum = parseFloat(String(job['Company Profit']).replace(/[^0-9.-]/g, '')) || 0;
          
          // Convert existing values to numbers to prevent string concatenation
          customer.total_revenue = (Number(customer.total_revenue) || 0) + actualRevenue;
          customer.total_costs = (Number(customer.total_costs) || 0) + totalCostsNum;
          customer.total_profit = (Number(customer.total_profit) || 0) + grossProfitNum;
          customer.technician_payouts = (Number(customer.technician_payouts) || 0) + technicianPayoutNum;
          customer.company_profit = (Number(customer.company_profit) || 0) + companyProfitNum;
          customer.total_spent = (Number(customer.total_spent) || 0) + totalCostsNum; // total_spent should be costs, not revenue
        }
        
        if (isClosedJob) {
          customer.completed_jobs++;
        } else if (jobStatus === 'Cancelled' || jobStatus === 'Canceled') {
          customer.cancelled_jobs++;
        }
        
        // Update last contact date
        customer.last_contact = jobDate;
      });
      
      // Convert Map to array and calculate additional metrics
      const customers = Array.from(customerMap.values()).map(customer => {
        // Convert locations Map to array
        customer.locations = Array.from(customer.locations.values());

        // Calculate first and last job dates
        const allJobDates = customer.locations.flatMap((loc: any) =>
          loc.jobs.map((job: any) => new Date(job.created_at))
        ).sort((a: any, b: any) => a.getTime() - b.getTime());

        customer.first_job_date = allJobDates[0]?.toISOString();
        customer.last_job_date = allJobDates[allJobDates.length - 1]?.toISOString();

        // Add tags based on customer behavior
        if (customer.total_revenue > 5000) {
          customer.tags.push('High Value');
        }
        if (customer.total_jobs > 3) {
          customer.tags.push('Repeat Customer');
        }
        if (customer.customer_type === 'commercial') {
          customer.tags.push('Commercial');
        }

        return customer;
      });
      
      // Sort by last job date (most recent first)
      customers.sort((a, b) => {
        if (!a.last_job_date && !b.last_job_date) return 0;
        if (!a.last_job_date) return 1;
        if (!b.last_job_date) return -1;
        return new Date(b.last_job_date).getTime() - new Date(a.last_job_date).getTime();
      });

      // Clean up any string values in customer totals to prevent concatenation issues
      const cleanedCustomers = customers.map(customer => ({
        ...customer,
        total_revenue: Number(customer.total_revenue) || 0,
        total_costs: Number(customer.total_costs) || 0,
        total_profit: Number(customer.total_profit) || 0,
        technician_payouts: Number(customer.technician_payouts) || 0,
        company_profit: Number(customer.company_profit) || 0,
        total_spent: Number(customer.total_spent) || 0
      }));

      setCustomers(cleanedCustomers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: any) => {
    try {
      if (isDemoEnvironment) {
        const newCustomer = {
          id: Date.now().toString(),
          ...customerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          locations: [],
          total_jobs: 0,
          total_spent: 0,
          completed_jobs: 0,
          cancelled_jobs: 0,
          tags: []
        };
        setCustomers(prev => [newCustomer, ...prev]);
        return newCustomer;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      await fetchCustomers(); // Refresh the list
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateCustomer = async (id: string, updates: any) => {
    try {
      if (isDemoEnvironment) {
        setCustomers(prev => prev.map(customer => 
          customer.id === id ? { ...customer, ...updates, updated_at: new Date().toISOString() } : customer
        ));
        return;
      }

      const { error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchCustomers(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addCustomerLocation = async (customerId: string, locationData: any) => {
    try {
      if (isDemoEnvironment) {
        const newLocation = {
          id: `${customerId}-${Date.now()}`,
          ...locationData,
          jobs: []
        };
        
        setCustomers(prev => prev.map(customer => {
          if (customer.id === customerId) {
            return {
              ...customer,
              locations: [...(customer.locations || []), newLocation]
            };
          }
          return customer;
        }));
        return newLocation;
      }

      const { data, error } = await supabase
        .from('customer_locations')
        .insert([{ customer_id: customerId, ...locationData }])
        .select()
        .single();

      if (error) throw error;
      await fetchCustomers(); // Refresh the list
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addCustomerNote = async (customerId: string, noteData: any) => {
    try {
      if (isDemoEnvironment) {
        // In demo mode, just add to customer notes
        setCustomers(prev => prev.map(customer => {
          if (customer.id === customerId) {
            return {
              ...customer,
              notes: [...(customer.notes || []), noteData]
            };
          }
          return customer;
        }));
        return;
      }

      const { error } = await supabase
        .from('customer_notes')
        .insert([{ customer_id: customerId, ...noteData }]);

      if (error) throw error;
      await fetchCustomers(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const mergeCustomers = async (primaryCustomerId: string, secondaryCustomerId: string) => {
    try {
      if (isDemoEnvironment) {
        alert('Customer merge completed! (Demo Mode)');
        await fetchCustomers();
        return;
      }

      // Get both customers
      const primaryCustomer = customers.find(c => c.id === primaryCustomerId);
      const secondaryCustomer = customers.find(c => c.id === secondaryCustomerId);

      if (!primaryCustomer || !secondaryCustomer) {
        throw new Error('One or both customers not found');
      }

      // Update all jobs from secondary customer to use primary customer's name
      const { error } = await supabase
        .from('all_jobs')
        .update({ 
          'Client Name': primaryCustomer.name,
          'Email': primaryCustomer.email || secondaryCustomer.email,
          'Phone': primaryCustomer.phone || secondaryCustomer.phone,
          'Address': primaryCustomer.primary_address || secondaryCustomer.primary_address
        })
        .eq('Client Name', secondaryCustomer.name);

      if (error) throw error;
      
      alert(`Successfully merged ${secondaryCustomer.name} into ${primaryCustomer.name}`);
      await fetchCustomers();
    } catch (err: any) {
      console.error('Error merging customers:', err);
      throw err;
    }
  };

  return { 
    customers, 
    loading, 
    error, 
    addCustomer, 
    updateCustomer, 
    addCustomerLocation, 
    addCustomerNote, 
    mergeCustomers,
    refetch: fetchCustomers 
  };
}

// Technicians hooks
export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        // Use mock data in demo mode
        const mockTechnicians = [
          { id: '1', name: 'Mike Johnson', email: 'mike@example.com', phone: '(555) 123-4567', commission_rate: 10, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '2', name: 'Sarah Davis', email: 'sarah@example.com', phone: '(555) 234-5678', commission_rate: 12, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '3', name: 'Tom Wilson', email: 'tom@example.com', phone: '(555) 345-6789', commission_rate: 8, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '4', name: 'Lisa Brown', email: 'lisa@example.com', phone: '(555) 456-7890', commission_rate: 15, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '5', name: 'David Miller', email: 'david@example.com', phone: '(555) 567-8901', commission_rate: 11, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' }
        ];
        setTechnicians(mockTechnicians);
        return;
      }

      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>) => {
    try {
      if (isDemoEnvironment) {
        setTechnicians(prev => prev.map(tech => 
          tech.id === id ? { ...tech, ...updates, updated_at: new Date().toISOString() } : tech
        ));
        return;
      }

      const { error } = await supabase
        .from('technicians')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchTechnicians(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { technicians, loading, error, updateTechnician, refetch: fetchTechnicians };
}

// Jobs hooks
export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        // Use mock data in demo mode with proper customer data
        const mockJobs = [
          {
            id: '1',
            customer_id: '1',
            technician_id: '1',
            stage_id: '1',
            title: 'Garage Door Repair',
            description: 'Fix garage door opener',
            estimated_price: 300,
            actual_price: 350,
            priority: 'medium',
            lead_source: 'Website',
            status: 'New Lead',
            due_date: '2024-02-15',
            notes: 'Customer reported door not opening',
            created_at: '2024-01-15',
            updated_at: '2024-01-15',
            customer: { id: '1', name: 'John Smith', email: 'john@example.com', phone: '(555) 123-4567', address: '123 Main St', created_at: '2024-01-01', updated_at: '2024-01-01' },
            technician: { id: '1', name: 'Dan', email: 'dan@example.com', phone: '(555) 111-2222', commission_rate: 50, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
            stage: { id: '1', name: 'New Lead', color: '#3B82F6', order_position: 1, created_at: '2024-01-01', updated_at: '2024-01-01' }
          },
          {
            id: '2',
            customer_id: '2',
            technician_id: '2',
            stage_id: '2',
            title: 'Spring Replacement',
            description: 'Replace broken garage door spring',
            estimated_price: 450,
            actual_price: undefined,
            priority: 'high',
            lead_source: 'Thumbtack',
            status: 'In Progress',
            due_date: '2024-02-20',
            notes: 'Emergency repair needed',
            created_at: '2024-01-20',
            updated_at: '2024-01-20',
            customer: { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '(555) 234-5678', address: '456 Oak Ave', created_at: '2024-01-01', updated_at: '2024-01-01' },
            technician: { id: '2', name: 'Ben', email: 'ben@example.com', phone: '(555) 333-4444', commission_rate: 50, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
            stage: { id: '2', name: 'In Progress', color: '#F59E0B', order_position: 2, created_at: '2024-01-01', updated_at: '2024-01-01' }
          },
          {
            id: '3',
            customer_id: '3',
            technician_id: '3',
            stage_id: '5',
            title: 'Door Installation',
            description: 'Install new garage door',
            estimated_price: 1200,
            actual_price: 1200,
            priority: 'medium',
            lead_source: 'Referral',
            status: 'Closed',
            due_date: '2024-01-25',
            notes: 'Completed successfully',
            created_at: '2024-01-10',
            updated_at: '2024-01-25',
            customer: { id: '3', name: 'Mike Davis', email: 'mike@example.com', phone: '(555) 345-6789', address: '789 Pine St', created_at: '2024-01-01', updated_at: '2024-01-01' },
            technician: { id: '3', name: 'Luka', email: 'luka@example.com', phone: '(555) 555-6666', commission_rate: 30, status: 'active', created_at: '2024-01-01', updated_at: '2024-01-01' },
            stage: { id: '5', name: 'Closed', color: '#10B981', order_position: 5, created_at: '2024-01-01', updated_at: '2024-01-01' }
          }
        ];
        setJobs(mockJobs);
        return;
      }

      // Fetch from all_jobs table instead of jobs table
      const { data: allJobsData, error } = await supabase
        .from('all_jobs')
        .select('*')
        .order('Count', { ascending: false });

      if (error) throw error;
      
      // Transform all_jobs data to match the expected job structure
      const transformedJobs = allJobsData?.map((job: any) => ({
        id: job.Count || job.id || Math.random().toString(),
        customer_id: job['Client Name'] || 'unknown',
        technician_id: job['Technician'] || 'unknown',
        stage_id: job['Status'] || 'New Lead',
        title: job['Parts Sold'] || 'Untitled Job',
        description: job['Parts Sold'] || '',
        estimated_price: parseFloat(String(job['Sales']).replace(/[^0-9.-]/g, '')) || 0,
        actual_price: parseFloat(String(job['Sales']).replace(/[^0-9.-]/g, '')) || undefined,
        priority: 'medium',
        lead_source: job['LP'] || 'Unknown',
        status: job['Status'] || 'New Lead',
        due_date: job['Date'] || '',
        notes: job['Notes'] || '',
        created_at: job['Date'] || new Date().toISOString(),
        updated_at: job['Date'] || new Date().toISOString(),
        // Include raw data for editing
        rawData: job,
        customer: {
          id: job['Client Name'] || 'unknown',
          name: job['Client Name'] || 'Unknown Customer',
          email: job['Email'] || '',
          phone: job['Phone'] || '',
          address: job['Address'] || '',
          created_at: job['Date'] || new Date().toISOString(),
          updated_at: job['Date'] || new Date().toISOString()
        },
        technician: {
          id: job['Technician'] || 'unknown',
          name: job['Technician'] || 'Unassigned',
          email: '',
          phone: '',
          commission_rate: 30,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        stage: {
          id: job['Status'] || 'New Lead',
          name: job['Status'] || 'New Lead',
          color: getStatusColor(job['Status'] || 'New Lead'),
          order_position: getStatusOrder(job['Status'] || 'New Lead'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })) || [];
      
      setJobs(transformedJobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New Lead': '#3B82F6',
      'In Progress': '#F59E0B',
      'Awaiting Parts': '#EF4444',
      'Pending Payment': '#8B5CF6',
      'Closed': '#10B981',
      'Completed': '#10B981',
      'Finished': '#10B981',
      'Cancelled': '#6B7280',
      'Canceled': '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  // Helper function to get status order
  const getStatusOrder = (status: string) => {
    const orders: { [key: string]: number } = {
      'New Lead': 1,
      'In Progress': 2,
      'Awaiting Parts': 3,
      'Pending Payment': 4,
      'Closed': 5,
      'Completed': 5,
      'Finished': 5,
      'Cancelled': 6,
      'Canceled': 6
    };
    return orders[status] || 7;
  };

  const addJob = async (jobData: any) => {
    try {
      if (isDemoEnvironment) {
        const newJob = {
          id: Date.now().toString(),
          ...jobData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setJobs(prev => [newJob, ...prev]);
        return newJob;
      }

      const { data, error } = await supabase
        .from('all_jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) throw error;
      await fetchJobs(); // Refresh the list
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateJob = async (id: string, updates: any) => {
    try {
      if (isDemoEnvironment) {
        setJobs(prev => prev.map(job => 
          job.id === id ? { ...job, ...updates, updated_at: new Date().toISOString() } : job
        ));
        return;
      }

      const { error } = await supabase
        .from('all_jobs')
        .update(updates)
        .eq('Count', id);

      if (error) throw error;
      await fetchJobs(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { jobs, loading, error, addJob, updateJob, refetch: fetchJobs };
}

// Deleted Jobs hook
export function useDeletedJobs() {
  const [deletedJobs, setDeletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletedJobs();
  }, []);

  const fetchDeletedJobs = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        setDeletedJobs([]);
        return;
      }

      const { data: allJobsData, error } = await supabase
        .from('all_jobs')
        .select('*')
        .eq('Status', 'Deleted')
        .order('Count', { ascending: false });

      if (error) throw error;
      
      const transformedJobs = allJobsData?.map((job: any) => ({
        id: job.Count || job.id || Math.random().toString(),
        customer_id: job['Client Name'] || 'unknown',
        technician_id: job['Technician'] || 'unknown',
        stage_id: job['Status'] || 'Deleted',
        title: job['Parts Sold'] || 'Untitled Job',
        description: job['Parts Sold'] || '',
        estimated_price: parseFloat(String(job['Sales']).replace(/[^0-9.-]/g, '')) || 0,
        actual_price: parseFloat(String(job['Sales']).replace(/[^0-9.-]/g, '')) || undefined,
        priority: 'medium',
        lead_source: job['LP'] || 'Unknown',
        status: job['Status'] || 'Deleted',
        due_date: job['Date'] || '',
        notes: job['Notes'] || '',
        created_at: job['Date'] || new Date().toISOString(),
        updated_at: job['Date'] || new Date().toISOString(),
        rawData: job,
        customer: {
          id: job['Client Name'] || 'unknown',
          name: job['Client Name'] || 'Unknown Customer',
          email: job['Email'] || '',
          phone: job['Phone'] || '',
          address: job['Address'] || '',
          created_at: job['Date'] || new Date().toISOString(),
          updated_at: job['Date'] || new Date().toISOString()
        },
        technician: {
          id: job['Technician'] || 'unknown',
          name: job['Technician'] || 'Unassigned',
          email: '',
          phone: '',
          commission_rate: 30,
          status: 'active',
          created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        },
        stage: {
          id: job['Status'] || 'Deleted',
          name: job['Status'] || 'Deleted',
          color: '#6B7280',
          order_position: 999,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })) || [];
      
      setDeletedJobs(transformedJobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restoreJob = async (jobId: string) => {
    try {
      if (isDemoEnvironment) {
        await fetchDeletedJobs();
        alert('Job restored successfully! (Demo Mode)');
        return;
      }

      const { error } = await supabase
        .from('all_jobs')
        .update({ 
          'Status': 'New Lead',
          'deleted_at': null,
          'is_deleted': null 
        })
        .eq('Count', jobId);

      if (error) throw error;
      await fetchDeletedJobs();
      alert('Job restored successfully!');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const permanentDeleteJob = async (jobId: string) => {
    try {
      if (isDemoEnvironment) {
        await fetchDeletedJobs();
        alert('Job permanently deleted! (Demo Mode)');
        return;
      }

      const { error } = await supabase
        .from('all_jobs')
        .delete()
        .eq('Count', jobId);

      if (error) throw error;
      await fetchDeletedJobs();
      alert('Job permanently deleted!');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { deletedJobs, loading, error, restoreJob, permanentDeleteJob, refetch: fetchDeletedJobs };
}

// Pipeline Stages hooks
export function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        // Use mock data in demo mode - only set once
        if (!initialized) {
          const mockStages = [
            { id: '1', name: 'New Lead', color: '#3B82F6', order_position: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: '2', name: 'In Progress', color: '#F59E0B', order_position: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: '3', name: 'Awaiting Parts', color: '#EF4444', order_position: 3, created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: '4', name: 'Pending Payment', color: '#8B5CF6', order_position: 4, created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: '5', name: 'Closed', color: '#10B981', order_position: 5, created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: '6', name: 'Cancelled', color: '#6B7280', order_position: 6, created_at: '2024-01-01', updated_at: '2024-01-01' }
          ];
          setStages(mockStages);
          setInitialized(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order_position');

      if (error) throw error;
      
      // Remove duplicates by name and sort by order_position
      const uniqueStages = data?.filter((stage, index, self) => 
        index === self.findIndex(s => s.name === stage.name)
      ).sort((a, b) => a.order_position - b.order_position) || [];
      
      setStages(uniqueStages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addStage = async (stage: Omit<PipelineStage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // In demo mode, don't add stages - they're already provided
      if (isDemoEnvironment) {
        console.warn('Cannot add stages in demo mode - stages are predefined');
        return null;
      }

      // Check if stage with same name already exists
      const existingStage = stages.find(s => s.name.toLowerCase() === stage.name.toLowerCase());
      if (existingStage) {
        throw new Error('A stage with this name already exists');
      }

      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert([stage])
        .select()
        .single();

      if (error) throw error;
      await fetchStages(); // Refresh the list
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
    try {
      if (isDemoEnvironment) {
        setStages(prev => prev.map(stage => 
          stage.id === id ? { ...stage, ...updates, updated_at: new Date().toISOString() } : stage
        ));
        return;
      }

      const { error } = await supabase
        .from('pipeline_stages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchStages(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStage = async (id: string) => {
    try {
      if (isDemoEnvironment) {
        setStages(prev => prev.filter(stage => stage.id !== id));
        return;
      }

      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStages(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { stages, loading, error, addStage, updateStage, deleteStage, refetch: fetchStages };
}

// Form Fields hooks
export function useFormFields() {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFormFields();
  }, []);

  const fetchFormFields = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        const mockFormFields = [
          { id: '1', name: 'customer_name', label: 'Customer Name', type: 'text', required: true, order_position: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '2', name: 'phone', label: 'Phone Number', type: 'tel', required: true, order_position: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '3', name: 'email', label: 'Email Address', type: 'email', required: false, order_position: 3, created_at: '2024-01-01', updated_at: '2024-01-01' }
        ];
        setFormFields(mockFormFields);
        return;
      }

      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .order('order_position');

      if (error) throw error;
      setFormFields(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { formFields, loading, error, refetch: fetchFormFields };
}

// Settings hooks
export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      if (isDemoEnvironment) {
        const mockSettings = [
          { id: '1', key: 'company_name', value: 'Smart Garage Doors', created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: '2', key: 'default_commission_rate', value: 10, created_at: '2024-01-01', updated_at: '2024-01-01' }
        ];
        setSettings(mockSettings);
        return;
      }

      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;
      setSettings(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refetch: fetchSettings };
}