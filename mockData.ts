
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
  },
  {
    id: 'c3',
    name: 'Arjun Verma',
    email: 'arjun.verma@example.com',
    phone: '+91 9811223344',
    bloodGroup: 'B+',
    age: 26,
    role: UserRole.CITIZEN,
    location: { lat: 28.6250, lng: 77.2150, city: 'Connaught Place', state: 'Delhi' },
    totalDonated: 2.0,
    history: [
      { id: 'h5', hospitalName: 'All India Institute', date: '2024-03-12', amountLitres: 0.5 }
    ]
  },
  {
    id: 'c4',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    phone: '+91 9822334455',
    bloodGroup: 'O-',
    age: 29,
    role: UserRole.CITIZEN,
    location: { lat: 28.5700, lng: 77.2400, city: 'Lajpat Nagar', state: 'Delhi' },
    totalDonated: 4.0,
    history: [
      { id: 'h6', hospitalName: 'Apollo Speciality', date: '2024-04-18', amountLitres: 0.5 }
    ]
  },
  {
    id: 'c5',
    name: 'Rahul Nair',
    email: 'rahul.nair@example.com',
    phone: '+91 9900112233',
    bloodGroup: 'AB+',
    age: 31,
    role: UserRole.CITIZEN,
    location: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka' },
    totalDonated: 1.5,
    history: [
      { id: 'h7', hospitalName: 'Manipal Hospital', date: '2024-01-15', amountLitres: 0.5 }
    ]
  },
  {
    id: 'c6',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@example.com',
    phone: '+91 9845112299',
    bloodGroup: 'O+',
    age: 24,
    role: UserRole.CITIZEN,
    location: { lat: 12.9352, lng: 77.6245, city: 'Koramangala, Bengaluru', state: 'Karnataka' },
    totalDonated: 2.5,
    history: [
      { id: 'h8', hospitalName: 'Fortis Hospital', date: '2024-05-02', amountLitres: 0.5 }
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
    location: { lat: 28.6139, lng: 77.2090, city: 'Central Delhi', state: 'Delhi' },
    inventory: {
      'A+': 12, 'A-': 5, 'B+': 15, 'B-': 2, 'AB+': 8, 'AB-': 1, 'O+': 20, 'O-': 4
    }
  },
  {
    id: 'h2',
    name: "St. Mary's Trauma Center",
    hospitalCode: 'HOS002',
    email: 'info@stmarys.org',
    role: UserRole.HOSPITAL,
    location: { lat: 19.0760, lng: 72.8777, city: 'South Mumbai', state: 'Maharashtra' },
    inventory: {
      'A+': 4, 'A-': 0, 'B+': 10, 'B-': 3, 'AB+': 5, 'AB-': 0, 'O+': 15, 'O-': 1
    }
  },
  {
    id: 'h3',
    name: 'Apex Super Speciality Hospital',
    hospitalCode: 'HOS003',
    email: 'emergency@apexhospital.org',
    role: UserRole.HOSPITAL,
    location: { lat: 28.5355, lng: 77.2600, city: 'Saket, New Delhi', state: 'Delhi' },
    inventory: {
      'A+': 8, 'A-': 2, 'B+': 0, 'B-': 0, 'AB+': 3, 'AB-': 0, 'O+': 0, 'O-': 0
    }
  },
  {
    id: 'h4',
    name: 'Fortis Memorial Blood Bank',
    hospitalCode: 'HOS004',
    email: 'bloodbank@fortisdelhi.org',
    role: UserRole.HOSPITAL,
    location: { lat: 28.4595, lng: 77.0266, city: 'Gurugram', state: 'Haryana' },
    inventory: {
      'A+': 18, 'A-': 4, 'B+': 22, 'B-': 6, 'AB+': 9, 'AB-': 2, 'O+': 35, 'O-': 8
    }
  },
  {
    id: 'h5',
    name: 'Manipal Emergency Center',
    hospitalCode: 'HOS005',
    email: 'blood@manipal.edu',
    role: UserRole.HOSPITAL,
    location: { lat: 12.9856, lng: 77.6057, city: 'Bengaluru', state: 'Karnataka' },
    inventory: {
      'A+': 14, 'A-': 3, 'B+': 11, 'B-': 1, 'AB+': 7, 'AB-': 2, 'O+': 25, 'O-': 6
    }
  }
];
