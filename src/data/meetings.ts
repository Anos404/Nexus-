import { AvailabilitySlot, Meeting } from '../types';

// Storage keys
const AVAILABILITY_STORAGE_KEY = 'business_nexus_availability';
const MEETINGS_STORAGE_KEY = 'business_nexus_meetings';

// Initial mock availability slots
const initialAvailability: AvailabilitySlot[] = [
  // Sarah Johnson (e1) - Entrepreneur
  { id: 'slot_1', userId: 'e1', date: '2026-07-03', startTime: '10:00', endTime: '11:00', isBooked: true },
  { id: 'slot_2', userId: 'e1', date: '2026-07-03', startTime: '14:30', endTime: '15:30', isBooked: false },
  { id: 'slot_3', userId: 'e1', date: '2026-07-04', startTime: '09:00', endTime: '10:00', isBooked: true },
  { id: 'slot_4', userId: 'e1', date: '2026-07-04', startTime: '11:00', endTime: '12:00', isBooked: false },
  { id: 'slot_5', userId: 'e1', date: '2026-07-05', startTime: '13:00', endTime: '14:00', isBooked: false },
  { id: 'slot_6', userId: 'e1', date: '2026-07-06', startTime: '15:00', endTime: '16:00', isBooked: false },

  // Michael Rodriguez (i1) - Investor
  { id: 'slot_7', userId: 'i1', date: '2026-07-03', startTime: '09:00', endTime: '10:00', isBooked: false },
  { id: 'slot_8', userId: 'i1', date: '2026-07-03', startTime: '11:00', endTime: '12:00', isBooked: true },
  { id: 'slot_9', userId: 'i1', date: '2026-07-05', startTime: '14:00', endTime: '15:00', isBooked: false },

  // Maya Patel (e3) - Entrepreneur
  { id: 'slot_10', userId: 'e3', date: '2026-07-03', startTime: '11:00', endTime: '12:00', isBooked: false },
  { id: 'slot_11', userId: 'e3', date: '2026-07-04', startTime: '14:00', endTime: '15:00', isBooked: false },
];

// Initial mock meetings
const initialMeetings: Meeting[] = [
  {
    id: 'meet_1',
    title: 'Initial Pitch Review - TechWave AI',
    description: 'Discuss seed round allocation and product roadmap for the AI financial platform.',
    hostId: 'e1', // Sarah Johnson
    inviteeId: 'i1', // Michael Rodriguez
    date: '2026-07-03',
    startTime: '10:00',
    endTime: '11:00',
    status: 'accepted',
    senderId: 'i1',
    receiverId: 'e1',
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'meet_2',
    title: 'SaaS Expansion Strategy Session',
    description: 'Explore collaboration opportunities in SaaS and B2B sectors.',
    hostId: 'e1', // Sarah Johnson
    inviteeId: 'i1', // Michael Rodriguez
    date: '2026-07-04',
    startTime: '09:00',
    endTime: '10:00',
    status: 'accepted',
    senderId: 'i1',
    receiverId: 'e1',
    createdAt: '2026-07-02T11:30:00Z',
  },
  {
    id: 'meet_3',
    title: 'CleanTech Biodegradable Scale Session',
    description: 'Looking to schedule a discussion about green life packaging.',
    hostId: 'e2', // David Chen
    inviteeId: 'i2', // Jennifer Lee
    date: '2026-07-05',
    startTime: '10:00',
    endTime: '11:00',
    status: 'pending',
    senderId: 'i2',
    receiverId: 'e2',
    createdAt: '2026-07-02T14:15:00Z',
  },
  {
    id: 'meet_4',
    title: 'Mental Health Pulse Investment Pitch',
    description: 'Review HealthPulse traction data and team background.',
    hostId: 'e3', // Maya Patel
    inviteeId: 'i3', // Robert Torres
    date: '2026-07-03',
    startTime: '13:00',
    endTime: '14:00',
    status: 'pending',
    senderId: 'e3',
    receiverId: 'i3',
    createdAt: '2026-07-02T09:00:00Z',
  },
  {
    id: 'meet_5',
    title: 'Venture Investment Sync',
    description: 'Discuss financial projections and cap table structures.',
    hostId: 'i1', // Michael Rodriguez
    inviteeId: 'e1', // Sarah Johnson
    date: '2026-07-03',
    startTime: '11:00',
    endTime: '12:00',
    status: 'accepted',
    senderId: 'e1',
    receiverId: 'i1',
    createdAt: '2026-07-02T16:00:00Z',
  }
];

// Helper to load items from storage
const loadFromStorage = <T>(key: string, fallback: T[]): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(data);
};

// Helper to save items to storage
const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Local cache
let currentAvailability = loadFromStorage<AvailabilitySlot>(AVAILABILITY_STORAGE_KEY, initialAvailability);
let currentMeetings = loadFromStorage<Meeting>(MEETINGS_STORAGE_KEY, initialMeetings);

// Helper function to get availability slots for a user
export const getAvailabilityForUser = (userId: string): AvailabilitySlot[] => {
  return currentAvailability.filter(slot => slot.userId === userId);
};

// Helper function to add a slot
export const addAvailabilitySlot = (userId: string, date: string, startTime: string, endTime: string): AvailabilitySlot => {
  const newSlot: AvailabilitySlot = {
    id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    date,
    startTime,
    endTime,
    isBooked: false
  };

  currentAvailability.push(newSlot);
  saveToStorage(AVAILABILITY_STORAGE_KEY, currentAvailability);
  return newSlot;
};

// Helper function to delete a slot
export const deleteAvailabilitySlot = (slotId: string): boolean => {
  const initialLength = currentAvailability.length;
  currentAvailability = currentAvailability.filter(slot => slot.id !== slotId);
  saveToStorage(AVAILABILITY_STORAGE_KEY, currentAvailability);
  return currentAvailability.length < initialLength;
};

// Helper function to get meetings for a user (as either host or invitee)
export const getMeetingsForUser = (userId: string): Meeting[] => {
  return currentMeetings.filter(meet => meet.hostId === userId || meet.inviteeId === userId);
};

// Helper function to create a new meeting request
export const createMeetingRequest = (
  title: string,
  description: string | undefined,
  hostId: string,
  inviteeId: string,
  date: string,
  startTime: string,
  endTime: string,
  senderId: string,
  receiverId: string
): Meeting => {
  const newMeeting: Meeting = {
    id: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    hostId,
    inviteeId,
    date,
    startTime,
    endTime,
    status: 'pending',
    senderId,
    receiverId,
    createdAt: new Date().toISOString()
  };

  currentMeetings.push(newMeeting);
  saveToStorage(MEETINGS_STORAGE_KEY, currentMeetings);

  // Mark corresponding availability slot as booked
  const slotIndex = currentAvailability.findIndex(slot => 
    slot.userId === hostId && 
    slot.date === date && 
    slot.startTime === startTime
  );
  if (slotIndex !== -1) {
    currentAvailability[slotIndex].isBooked = true;
    saveToStorage(AVAILABILITY_STORAGE_KEY, currentAvailability);
  }

  return newMeeting;
};

// Helper function to update a meeting's status (accept/decline)
export const updateMeetingStatus = (meetingId: string, status: 'accepted' | 'declined'): Meeting | null => {
  const meetingIndex = currentMeetings.findIndex(meet => meet.id === meetingId);
  if (meetingIndex === -1) return null;

  const meeting = currentMeetings[meetingIndex];
  meeting.status = status;
  saveToStorage(MEETINGS_STORAGE_KEY, currentMeetings);

  // If declined, free up the availability slot
  if (status === 'declined') {
    const slotIndex = currentAvailability.findIndex(slot => 
      slot.userId === meeting.hostId && 
      slot.date === meeting.date && 
      slot.startTime === meeting.startTime
    );
    if (slotIndex !== -1) {
      currentAvailability[slotIndex].isBooked = false;
      saveToStorage(AVAILABILITY_STORAGE_KEY, currentAvailability);
    }
  }

  return meeting;
};
