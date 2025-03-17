import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const BASE_URL = 'http://localhost:3000/api/leads/leads';
const WORKSPACE_ID = '__REPLACE_WITH_ACTUAL_WORKSPACE_ID__'; // Replace with actual workspace ID

// Test data
const domains = ['example.com', 'test.com', 'company.com', 'business.org', 'enterprise.net'];
const companies = ['Acme Inc', 'TechCorp', 'GlobalSoft', 'InnovateSystems', 'FutureTech'];
const positions = ['CEO', 'CTO', 'Manager', 'Developer', 'Designer', 'Sales Rep', 'Marketing Specialist'];
const contactMethods = ['Email', 'Phone', 'Website', 'Referral', 'Social Media'];

// Load testing scenarios
export const options = {
  scenarios: {
    // Scenario 1: Lead Retrieval
    retrieve_leads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },   // Ramp up to 100 users
        { duration: '1m', target: 1000 },   // Ramp up to 1000 users
        { duration: '2m', target: 5000 },   // Ramp up to 5000 users
        { duration: '1m', target: 10000 },  // Ramp up to 10000 users
        { duration: '1m', target: 0 },      // Ramp down to 0 users
      ],
      exec: 'retrieveLeads',
      gracefulRampDown: '30s',
    },
    
    // Scenario 2: Lead Insertion
    insert_leads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },    // Ramp up to 50 users
        { duration: '1m', target: 500 },    // Ramp up to 500 users
        { duration: '2m', target: 2000 },   // Ramp up to 2000 users
        { duration: '1m', target: 5000 },   // Ramp up to 5000 users
        { duration: '1m', target: 0 },      // Ramp down to 0 users
      ],
      exec: 'insertLeads',
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

// Function to generate a random lead
function generateRandomLead() {
  const firstName = randomString(8);
  const lastName = randomString(8);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const contactMethod = contactMethods[Math.floor(Math.random() * contactMethods.length)];
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    phone: `+1${Math.floor(Math.random() * 1000000000) + 1000000000}`,
    company: company,
    position: position,
    contact_method: contactMethod,
    revenue: Math.floor(Math.random() * 1000000),
    work_id: WORKSPACE_ID,
  };
}

// Function to retrieve leads with pagination
export function retrieveLeads() {
  const limit = 12;
  const offset = Math.floor(Math.random() * 100) * limit; // Random page
  const sortBy = 'created_at';
  const sortOrder = Math.random() > 0.5 ? 'asc' : 'desc';
  
  const url = `${BASE_URL}?action=getLeadsByWorkspace&workspaceId=${WORKSPACE_ID}&limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`, // API token from environment variable
    },
  };
  
  const response = http.get(url, params);
  
  check(response, {
    'is status 200': (r) => r.status === 200,
    'has data': (r) => r.json().data !== undefined,
    'has pagination': (r) => r.json().pagination !== undefined,
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Function to insert leads
export function insertLeads() {
  const url = `${BASE_URL}?action=createLead&workspaceId=${WORKSPACE_ID}`;
  
  const payload = generateRandomLead();
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`, // API token from environment variable
    },
  };
  
  const response = http.post(url, JSON.stringify(payload), params);
  
  check(response, {
    'is status 200': (r) => r.status === 200,
    'has data': (r) => r.json() !== undefined,
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Function to insert multiple leads at once
export function insertMultipleLeads() {
  const url = `${BASE_URL}?action=createManyLead&workspaceId=${WORKSPACE_ID}`;
  
  const leads = [];
  const batchSize = 10; // Insert 10 leads at once
  
  for (let i = 0; i < batchSize; i++) {
    leads.push(generateRandomLead());
  }
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`, // API token from environment variable
    },
  };
  
  const response = http.post(url, JSON.stringify(leads), params);
  
  check(response, {
    'is status 200': (r) => r.status === 200,
    'has data': (r) => r.json().data !== undefined,
  });
  
  sleep(Math.random() * 3 + 2); // Random sleep between 2-5 seconds
}
