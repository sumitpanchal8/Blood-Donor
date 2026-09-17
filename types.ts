
export enum UserRole {
  CITIZEN = 'CITIZEN',
  HOSPITAL = 'HOSPITAL'
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Location {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

export interface DonationRecord {
  id: string;
  hospitalName: string;
  date: string;
  amountLitres: number;
}

export interface Citizen {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  age: number;
  location: Location;
  totalDonated: number;
  history: DonationRecord[];
  role: UserRole.CITIZEN;
}

export interface Hospital {
  id: string;
  name: string;
  hospitalCode: string;
  email: string;
  location: Location;
  inventory: Record<BloodGroup, number>;
  role: UserRole.HOSPITAL;
}

export type User = Citizen | Hospital | null;

export interface EmergencySearchFilters {
  bloodGroup: BloodGroup;
  radiusKm: number;
}
