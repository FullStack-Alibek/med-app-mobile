export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  photo: string;
  available: boolean;
  price: number;
  location: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
  manufacturer: string;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface DeviceCartItem {
  device: import('../data/devices').Device;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
