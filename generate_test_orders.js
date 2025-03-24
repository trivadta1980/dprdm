import fs from 'fs';
import { format } from 'date-fns';

// SFDC Countries dataset from logs
const sfdcCountries = [
  'Australia1',
  'Brazil1',
  'Canada1',
  'Denmark1',
  'Egypt1',
  'France1',
  'Germany1',
  'Hungary1',
  'Indonesia1',
  'Japan1',
  'India1',
  'Spain'
];

// Countries not in SFDC dataset
const nonMappedCountries = [
  'Italy',
  'Greece',
  'Netherlands',
  'Sweden',
  'Norway',
  'Singapore',
  'Malaysia',
  'Thailand',
  'Vietnam',
  'Chile',
  'Argentina',
  'Mexico',
  'South Africa',
  'Australia', // Note: This is similar to Australia1 but not exact match
  'Japan',     // Note: This is similar to Japan1 but not exact match
  'Brazil',    // Note: This is similar to Brazil1 but not exact match
  'India',     // Note: This is similar to India1 but not exact match
  'China',
  'United Kingdom',
  'Russia'
];

// City and state pairs
const cityStatePairs = [
  { city: 'New York', state: 'NY' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Philadelphia', state: 'PA' },
  { city: 'San Antonio', state: 'TX' },
  { city: 'San Diego', state: 'CA' },
  { city: 'Dallas', state: 'TX' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'Austin', state: 'TX' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Denver', state: 'CO' },
  { city: 'Boston', state: 'MA' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Miami', state: 'FL' },
  { city: 'Las Vegas', state: 'NV' },
  { city: 'Portland', state: 'OR' },
  { city: 'Nashville', state: 'TN' },
  { city: 'Baltimore', state: 'MD' }
];

// Customer names
const customerNames = [
  'John Smith',
  'Jane Doe',
  'Michael Johnson',
  'Emma Brown',
  'James Wilson',
  'Emily Davis',
  'Robert Miller',
  'Olivia Garcia',
  'William Jones',
  'Sophia Martinez',
  'David Anderson',
  'Isabella Taylor',
  'Joseph Rodriguez',
  'Mia Hernandez',
  'Thomas Moore',
  'Charlotte Lee',
  'Daniel White',
  'Amelia King',
  'Matthew Scott',
  'Harper Green'
];

// Order statuses
const orderStatuses = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'On Hold'
];

// Function to generate a random date between start and end
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate a random dollar amount between min and max
function randomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Generate 100 orders
function generateOrders(count) {
  const orders = [];
  
  // Create 70% with SFDC countries and 30% with non-mapped countries
  const sfdcCount = Math.floor(count * 0.7);
  const nonMappedCount = count - sfdcCount;
  
  // Generate orders with SFDC countries
  for (let i = 0; i < sfdcCount; i++) {
    const orderDate = randomDate(new Date(2024, 0, 1), new Date(2025, 2, 1));
    const formattedDate = format(orderDate, 'yyyy-MM-dd');
    const cityState = cityStatePairs[Math.floor(Math.random() * cityStatePairs.length)];
    const country = sfdcCountries[Math.floor(Math.random() * sfdcCountries.length)];
    
    orders.push({
      OrderID: `ORD${String(i + 1).padStart(4, '0')}`,
      OrderDate: formattedDate,
      CustomerName: customerNames[Math.floor(Math.random() * customerNames.length)],
      City: cityState.city,
      State: cityState.state,
      Country: country,
      Amount: randomAmount(100, 5000),
      Status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
    });
  }
  
  // Generate orders with non-mapped countries
  for (let i = 0; i < nonMappedCount; i++) {
    const orderDate = randomDate(new Date(2024, 0, 1), new Date(2025, 2, 1));
    const formattedDate = format(orderDate, 'yyyy-MM-dd');
    const cityState = cityStatePairs[Math.floor(Math.random() * cityStatePairs.length)];
    const country = nonMappedCountries[Math.floor(Math.random() * nonMappedCountries.length)];
    
    orders.push({
      OrderID: `ORD${String(sfdcCount + i + 1).padStart(4, '0')}`,
      OrderDate: formattedDate,
      CustomerName: customerNames[Math.floor(Math.random() * customerNames.length)],
      City: cityState.city,
      State: cityState.state,
      Country: country,
      Amount: randomAmount(100, 5000),
      Status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
    });
  }
  
  // Add a few special test cases
  // Empty country
  orders.push({
    OrderID: `ORD${String(count + 1).padStart(4, '0')}`,
    OrderDate: format(new Date(), 'yyyy-MM-dd'),
    CustomerName: 'Test User',
    City: 'Test City',
    State: 'TS',
    Country: '',
    Amount: '299.99',
    Status: 'Processing'
  });
  
  // Extremely large order
  orders.push({
    OrderID: `ORD${String(count + 2).padStart(4, '0')}`,
    OrderDate: format(new Date(), 'yyyy-MM-dd'),
    CustomerName: 'Big Spender',
    City: 'Las Vegas',
    State: 'NV',
    Country: 'Brazil1',
    Amount: '99999.99',
    Status: 'Processing'
  });
  
  return orders;
}

// Convert orders to CSV
function convertToCSV(orders) {
  const header = 'OrderID,OrderDate,CustomerName,City,State,Country,Amount,Status';
  const rows = orders.map(order => {
    return `${order.OrderID},${order.OrderDate},${order.CustomerName},${order.City},${order.State},${order.Country},${order.Amount},${order.Status}`;
  });
  
  return [header, ...rows].join('\n');
}

// Generate 100 orders and write to CSV
const orders = generateOrders(98); // 98 + 2 special cases = 100
const csv = convertToCSV(orders);

fs.writeFileSync('test_orders.csv', csv);
console.log('Generated 100 test orders in test_orders.csv');