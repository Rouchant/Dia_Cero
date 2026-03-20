export interface UserProgressData {
  id: string;
  name: string;
  email: string;
  progressPercentage: number;
  averageScore: number;
  lastActive: string;
  status: 'active' | 'completed' | 'inactive';
}

export const MOCK_USERS: UserProgressData[] = [
  { id: '1', name: 'Laura Martínez', email: 'laura.m@diacero.com', progressPercentage: 100, averageScore: 92, lastActive: 'Hoy, 09:30 AM', status: 'completed' },
  { id: '2', name: 'Carlos Díaz', email: 'cdiaz@empresa.com', progressPercentage: 65, averageScore: 85, lastActive: 'Ayer, 18:45 PM', status: 'active' },
  { id: '3', name: 'Elena Rojas', email: 'elena.rojas@startup.io', progressPercentage: 20, averageScore: 70, lastActive: 'Mar 15, 2024', status: 'inactive' },
  { id: '4', name: 'Miguel Torres', email: 'mtorres@gmail.com', progressPercentage: 80, averageScore: 88, lastActive: 'Hoy, 11:20 AM', status: 'active' },
  { id: '5', name: 'Sofía Castro', email: 'sofia.c@diacero.com', progressPercentage: 100, averageScore: 95, lastActive: 'Mar 10, 2024', status: 'completed' },
  { id: '6', name: 'Alejandro Vega', email: 'avega@tech.com', progressPercentage: 0, averageScore: 0, lastActive: 'Mar 01, 2024', status: 'inactive' },
  { id: '7', name: 'Valentina Silva', email: 'valentina@agency.co', progressPercentage: 45, averageScore: 78, lastActive: 'Hoy, 13:15 PM', status: 'active' }
];
