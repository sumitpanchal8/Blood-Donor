
import { Citizen, Hospital, UserRole, BloodGroup } from './types';

export const MOCK_CITIZENS: Citizen[] = [
  {
    id: 'c1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 9876543210',
    bloodGroup: 'O+',
    age: 28,
    role: UserRole.CITIZEN,
    location: { lat: 28.6139, lng: 77.2090, city: 'New Delhi', state: 'Delhi' },
    totalDonated: 3.5,
    history: [
      { id: 'h1', hospitalName: 'City Care Hospital', date: '2023-10-15', amountLitres: 0.5 },
      { id: 'h2', hospitalName: 'Metro General', date: '2024-01-20', amountLitres: 0.5 },
      { id: 'h3', hospitalName: 'Red Cross Center', date: '2024-05-12', amountLitres: 0.5 },
    ]
  },
  {
    id: 'c2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    phone: '+91 9876543211',
    bloodGroup: 'A-',
    age: 32,
    role: UserRole.CITIZEN,
    location: { lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
    totalDonated: 1.2,
    history: [
      { id: 'h4', hospitalName: 'LifeLine Hospital', date: '2024-02-10', amountLitres: 0.5 },
    ]
  }
];

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: 'h1',
    name: 'City Care General Hospital',
    hospitalCode: 'HOS001',
    email: 'admin@citycare.org',
    role: UserRole.HOSPITAL,
    location: { lat: 28.6139, lng: 77.2090, city: 'New Delhi', state: 'Delhi' },
    inventory: {
      'A+': 12, 'A-': 5, 'B+': 15, 'B-': 2, 'AB+': 8, 'AB-': 1, 'O+': 20, 'O-': 4
    }
  },
  {
    id: 'h2',
    name: 'St. Mary\'s Trauma Center',
    hospitalCode: 'HOS002',
    email: 'info@stmarys.org',
    role: UserRole.HOSPITAL,
    location: { lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
    inventory: {
      'A+': 4, 'A-': 0, 'B+': 10, 'B-': 3, 'AB+': 5, 'AB-': 0, 'O+': 15, 'O-': 1
    }
  }
];
