import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Check, X, 
  Calendar as CalendarIcon, Clock, User, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findUserById, users } from '../../data/users';
import { 
  getAvailabilityForUser, 
  addAvailabilitySlot, 
  deleteAvailabilitySlot, 
  getMeetingsForUser, 
  updateMeetingStatus,
  createMeetingRequest
} from '../../data/meetings';
import { AvailabilitySlot, Meeting } from '../../types';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

export const CalendarPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const bookingUserId = searchParams.get('userId'); // If we're booking on someone else's calendar
  
  // States
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-07-03')); // Seeded to the project current date
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-07-03');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Data States
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  
  // Form States (for adding slots)
  const [newSlotDate, setNewSlotDate] = useState<string>('2026-07-03');
  const [newSlotStart, setNewSlotStart] = useState<string>('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState<string>('10:00');
  
  // Booking Form States (if booking for someone else)
  const [bookingTitle, setBookingTitle] = useState<string>('');
  const [bookingDesc, setBookingDesc] = useState<string>('');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<AvailabilitySlot | null>(null);

  const targetUser = bookingUserId ? findUserById(bookingUserId) : null;
  const isBookingFlow = !!bookingUserId && !!targetUser;

  // Load slots and meetings
  const reloadData = () => {
    if (currentUser) {
      // If booking flow, we load target user's slots to book them, and current user's meetings
      const activeSlotUserId = isBookingFlow ? bookingUserId : currentUser.id;
      setSlots(getAvailabilityForUser(activeSlotUserId));
      setMeetings(getMeetingsForUser(currentUser.id));
    }
  };

  useEffect(() => {
    reloadData();
  }, [currentUser, bookingUserId]);

  if (!currentUser) return null;

  // Helper date parsing/formatting functions
  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add padded days from previous month to start on Sunday
    const startPadding = firstDay.getDay();
    for (let i = startPadding; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Add all days of current month
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add padded days from next month to fill complete weeks (up to 42 cells)
    const totalCellsNeeded = 42; 
    const currentCells = days.length;
    for (let i = 1; i <= totalCellsNeeded - currentCells; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const getDaysInWeek = (date: Date): Date[] => {
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek); // Start on Sunday
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Navigations
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleSelectDay = (day: Date) => {
    const dayStr = formatDateStr(day);
    setSelectedDateStr(dayStr);
    setNewSlotDate(dayStr);
  };

  // Availability slots handling
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotStart || !newSlotEnd) {
      toast.error('Please enter complete slot details');
      return;
    }
    
    addAvailabilitySlot(currentUser.id, newSlotDate, newSlotStart, newSlotEnd);
    toast.success('Availability slot added!');
    reloadData();
  };

  const handleDeleteSlot = (slotId: string) => {
    deleteAvailabilitySlot(slotId);
    toast.success('Availability slot removed');
    reloadData();
  };

  // Meetings request actions
  const handleMeetingAction = (meetingId: string, status: 'accepted' | 'declined') => {
    updateMeetingStatus(meetingId, status);
    toast.success(`Meeting request ${status}!`);
    reloadData();
  };

  // Booking a slot
  const handleBookMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking || !bookingTitle) {
      toast.error('Please specify a title and select a slot');
      return;
    }

    createMeetingRequest(
      bookingTitle,
      bookingDesc || 'No description provided.',
      targetUser!.id, // host is the profile owner
      currentUser.id, // invitee is the builder
      selectedSlotForBooking.date,
      selectedSlotForBooking.startTime,
      selectedSlotForBooking.endTime,
      currentUser.id, // sender
      targetUser!.id // receiver
    );

    toast.success('Meeting request sent successfully!');
    setSelectedSlotForBooking(null);
    setBookingTitle('');
    setBookingDesc('');
    reloadData();
  };

  // Month details representation
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const calendarDays = viewMode === 'month' ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate);
  const weekDaysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter meetings/slots for current views
  const meetingsForSelectedDay = meetings.filter((m: Meeting) => m.date === selectedDateStr);
  const slotsForSelectedDay = slots.filter((s: AvailabilitySlot) => s.date === selectedDateStr);

  // Incoming meeting requests needing approval
  const incomingRequests = meetings.filter((m: Meeting) => 
    m.status === 'pending' && 
    m.receiverId === currentUser.id
  );

  // Sent meeting requests
  const sentRequests = meetings.filter((m: Meeting) => 
    m.status === 'pending' && 
    m.senderId === currentUser.id
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-primary-600" size={28} />
            {isBookingFlow ? `Book Meeting with ${targetUser?.name}` : 'Scheduling Calendar'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isBookingFlow 
              ? `Select one of ${targetUser?.name}'s availability slots below to book a consultation.`
              : 'Define availability slots, confirm bookings, and manage your meetings workflow.'}
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2 glass-panel p-1 rounded-lg">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
              viewMode === 'month' 
                ? 'bg-white text-primary-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
              viewMode === 'week' 
                ? 'bg-white text-primary-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Body (Left Column 2-spans) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-lg border border-white/40 overflow-hidden">
            {/* Calendar Controls */}
            <CardHeader className="flex justify-between items-center py-4 bg-white/50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 capitalize">
                  {monthName} {currentDate.getFullYear()}
                </h2>
                {viewMode === 'week' && (
                  <span className="text-xs font-semibold bg-primary-100 text-primary-800 px-2.5 py-0.5 rounded-full">
                    Week View
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrev}
                  className="hover-scale"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date('2026-07-03'))}
                  className="hover-scale"
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNext}
                  className="hover-scale"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-4 bg-white/30 backdrop-blur-md">
              {/* Day headers */}
              <div className="grid grid-cols-7 text-center font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">
                {weekDaysHeader.map(day => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, idx) => {
                  const dayStr = formatDateStr(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isSelected = dayStr === selectedDateStr;
                  const isToday = dayStr === '2026-07-03';
                  
                  // Filter content for this day
                  const dayMeetings = meetings.filter((m: Meeting) => m.date === dayStr);
                  const daySlots = slots.filter((s: AvailabilitySlot) => s.userId === (isBookingFlow ? bookingUserId : currentUser.id) && s.date === dayStr);
                  
                  const hasConfirmed = dayMeetings.some((m: Meeting) => m.status === 'accepted');
                  const hasPending = dayMeetings.some((m: Meeting) => m.status === 'pending');
                  const hasAvailable = daySlots.some((s: AvailabilitySlot) => !s.isBooked);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectDay(day)}
                      className={`min-h-[85px] p-2 border rounded-lg flex flex-col justify-between cursor-pointer transition-all duration-250 relative ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50/70 shadow-sm ring-1 ring-primary-400' 
                          : isToday
                          ? 'border-accent-400 bg-accent-50/40 hover:bg-gray-100/80'
                          : 'border-gray-200/60 bg-white/70 hover:bg-gray-100/50'
                      } ${!isCurrentMonth && 'opacity-40'}`}
                    >
                      {/* Day Number */}
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-semibold ${
                          isToday 
                            ? 'text-accent-800 bg-accent-100 w-6 h-6 rounded-full flex items-center justify-center' 
                            : isSelected 
                            ? 'text-primary-800' 
                            : 'text-gray-700'
                        }`}>
                          {day.getDate()}
                        </span>
                        
                        {/* Tiny Indicator Dot */}
                        {isToday && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                          </span>
                        )}
                      </div>

                      {/* Display details of slots / meetings */}
                      <div className="mt-2 space-y-1">
                        {/* Confirmed meetings */}
                        {hasConfirmed && (
                          <div className="text-[10px] leading-tight font-medium bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate">
                            {dayMeetings.filter(m => m.status === 'accepted').length} confirmed
                          </div>
                        )}
                        
                        {/* Pending requests */}
                        {hasPending && (
                          <div className="text-[10px] leading-tight font-medium bg-amber-100 text-amber-800 rounded px-1 py-0.5 truncate animate-pulse">
                            {dayMeetings.filter(m => m.status === 'pending').length} pending
                          </div>
                        )}

                        {/* Availability tags */}
                        {hasAvailable && (
                          <div className="text-[10px] leading-tight font-medium bg-emerald-100 text-emerald-800 rounded px-1 py-0.5 truncate">
                            {daySlots.filter(s => !s.isBooked).length} slots free
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Agenda view for the selected day */}
          <Card className="glass-card shadow-md border border-white/40">
            <CardHeader className="bg-white/40 border-b border-gray-100 flex items-center justify-between py-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-gray-500" size={18} />
                Schedule for {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('default', { 
                  weekday: 'short', month: 'short', day: 'numeric' 
                })}
              </h3>
              <Badge variant="primary">{meetingsForSelectedDay.length} Meetings Scheduled</Badge>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              {meetingsForSelectedDay.length === 0 && slotsForSelectedDay.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm">No meetings or slots defined for this day.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Render meetings */}
                  {meetingsForSelectedDay.map((meet: Meeting) => {
                    const hostUser = findUserById(meet.hostId);
                    const inviteeUser = findUserById(meet.inviteeId);
                    const otherUser = currentUser.id === meet.hostId ? inviteeUser : hostUser;
                    
                    return (
                      <div 
                        key={meet.id} 
                        className={`flex items-start justify-between p-4 border rounded-xl hover-lift ${
                          meet.status === 'accepted' 
                            ? 'border-blue-200 bg-blue-50/50' 
                            : 'border-yellow-200 bg-yellow-50/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar 
                            src={otherUser?.avatarUrl || ''} 
                            alt={otherUser?.name || ''} 
                            size="md" 
                          />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">{meet.title}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">{meet.description}</p>
                            
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {meet.startTime} - {meet.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} /> With {otherUser?.name} ({otherUser?.role})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={meet.status === 'accepted' ? 'success' : 'warning'}>
                            {meet.status}
                          </Badge>
                          
                          {/* If meeting request is pending, let host accept/decline */}
                          {meet.status === 'pending' && meet.receiverId === currentUser.id && (
                            <div className="flex items-center gap-1 mt-1">
                              <button 
                                onClick={() => handleMeetingAction(meet.id, 'accepted')}
                                className="p-1 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                                title="Accept Request"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => handleMeetingAction(meet.id, 'declined')}
                                className="p-1 text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                                title="Decline Request"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Render availability slots */}
                  {!isBookingFlow && slotsForSelectedDay.map((slot: AvailabilitySlot) => (
                    <div 
                      key={slot.id} 
                      className={`flex items-center justify-between p-3 border border-emerald-100 rounded-lg ${
                        slot.isBooked ? 'bg-gray-100 opacity-60' : 'bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${slot.isBooked ? 'bg-gray-400' : 'bg-emerald-500'}`}></span>
                        <span className="text-sm font-semibold text-gray-800">
                          Availability Slot: {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.isBooked && (
                          <Badge variant="gray">Booked</Badge>
                        )}
                      </div>
                      
                      {!slot.isBooked && (
                        <button 
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-all duration-200 hover-scale"
                          title="Remove availability slot"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Action Panel / Side Managers (Right Column 1-span) */}
        <div className="space-y-6">
          {/* Booking Request UI (If accessing target user calendar) */}
          {isBookingFlow ? (
            <Card className="glass-card shadow-lg border border-primary-100 glow-primary">
              <CardHeader className="bg-primary-50 border-b border-primary-100 flex items-center gap-2 py-3.5">
                <Sparkles className="text-primary-600" size={18} />
                <h3 className="text-md font-bold text-primary-900">Request Meeting slot</h3>
              </CardHeader>
              <CardBody className="p-4">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                  <Avatar src={targetUser?.avatarUrl || ''} alt={targetUser?.name || ''} size="md" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{targetUser?.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{targetUser?.role}</p>
                  </div>
                </div>

                <form onSubmit={handleBookMeeting} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      1. Select Available Slot
                    </label>
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 p-1 bg-gray-50 rounded-lg border border-gray-100">
                      {slots.filter((s: AvailabilitySlot) => s.date === selectedDateStr && !s.isBooked).length === 0 ? (
                        <p className="text-xs text-center py-4 text-gray-500">
                          No free slots on this date.
                        </p>
                      ) : (
                        slots.filter((s: AvailabilitySlot) => s.date === selectedDateStr && !s.isBooked).map((s: AvailabilitySlot) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSlotForBooking(s)}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md border transition-all duration-200 ${
                              selectedSlotForBooking?.id === s.id
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-800 border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            {s.startTime} - {s.endTime}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Meeting Title"
                      value={bookingTitle}
                      onChange={(e) => setBookingTitle(e.target.value)}
                      required
                      placeholder="e.g. Cap Table Strategy & Synch"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description / Agenda
                    </label>
                    <textarea
                      value={bookingDesc}
                      onChange={(e) => setBookingDesc(e.target.value)}
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 min-h-[70px]"
                      placeholder="Discuss valuation details..."
                    />
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    disabled={!selectedSlotForBooking || !bookingTitle}
                    className="hover-scale font-semibold"
                  >
                    Send Booking Request
                  </Button>
                </form>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Availability Manager (For slots) */}
              <Card className="glass-card shadow-md border border-white/40">
                <CardHeader className="bg-white/40 border-b border-gray-100 py-3.5 flex items-center gap-2">
                  <Clock className="text-primary-600" size={18} />
                  <h3 className="text-md font-bold text-gray-900">Manage Availability</h3>
                </CardHeader>
                <CardBody className="p-4">
                  <form onSubmit={handleAddSlot} className="space-y-4">
                    <div>
                      <Input
                        label="Date"
                        type="date"
                        value={newSlotDate}
                        onChange={(e) => setNewSlotDate(e.target.value)}
                        required
                        fullWidth
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          label="Start Time"
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          required
                          fullWidth
                        />
                      </div>
                      <div>
                        <Input
                          label="End Time"
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          required
                          fullWidth
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      fullWidth
                      leftIcon={<Plus size={16} />}
                      className="hover-scale font-semibold"
                    >
                      Add Slot
                    </Button>
                  </form>
                </CardBody>
              </Card>

              {/* Action Requests Panel (Accept/Decline incoming requests) */}
              <Card className="glass-card shadow-md border border-white/40">
                <CardHeader className="bg-white/40 border-b border-gray-100 py-3 flex items-center justify-between">
                  <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                    <User className="text-amber-500" size={18} />
                    Incoming Requests
                  </h3>
                  <Badge variant="warning">{incomingRequests.length}</Badge>
                </CardHeader>
                <CardBody className="p-4">
                  {incomingRequests.length === 0 ? (
                    <p className="text-sm text-center py-4 text-gray-500">
                      No pending requests.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {incomingRequests.map((req: Meeting) => {
                        const senderUser = findUserById(req.senderId);
                        return (
                          <div key={req.id} className="p-3 border border-yellow-100 bg-yellow-50/20 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar src={senderUser?.avatarUrl || ''} alt={senderUser?.name || ''} size="sm" />
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">{req.title}</h4>
                                <p className="text-[10px] text-gray-500">From {senderUser?.name}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{req.description}</p>
                            
                            <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1.5 border-t border-dashed border-gray-200">
                              <span className="flex items-center gap-0.5"><Clock size={10} /> {req.date} @ {req.startTime}</span>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => handleMeetingAction(req.id, 'accepted')}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleMeetingAction(req.id, 'declined')}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Sent Requests Monitoring Panel */}
              <Card className="glass-card shadow-md border border-white/40">
                <CardHeader className="bg-white/40 border-b border-gray-100 py-3 flex items-center justify-between">
                  <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                    <User className="text-primary-500" size={18} />
                    Sent Requests
                  </h3>
                  <Badge variant="primary">{sentRequests.length}</Badge>
                </CardHeader>
                <CardBody className="p-4">
                  {sentRequests.length === 0 ? (
                    <p className="text-sm text-center py-4 text-gray-500">
                      No sent requests pending.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((req: Meeting) => {
                        const hostUser = findUserById(req.hostId);
                        return (
                          <div key={req.id} className="p-3 border border-gray-100 bg-gray-50/50 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-gray-900">{req.title}</h4>
                              <Badge variant="warning">{req.status}</Badge>
                            </div>
                            <p className="text-[10px] text-gray-500">To: {hostUser?.name} ({hostUser?.role})</p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock size={10} /> {req.date} ({req.startTime} - {req.endTime})
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
