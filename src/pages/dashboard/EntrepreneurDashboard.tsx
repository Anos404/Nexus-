import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, Clock, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { CollaborationRequest, Meeting, Investor } from '../../types';
import { getRequestsForEntrepreneur } from '../../data/collaborationRequests';
import { investors, findUserById } from '../../data/users';
import { getMeetingsForUser } from '../../data/meetings';
import { getWalletBalance } from '../../data/payments';
import { TourGuide } from '../../components/ui/TourGuide';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [recommendedInvestors] = useState(investors.slice(0, 3));
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  
  useEffect(() => {
    if (user) {
      // Load collaboration requests
      const requests = getRequestsForEntrepreneur(user.id);
      setCollaborationRequests(requests);

      // Load meetings
      const userMeetings = getMeetingsForUser(user.id);
      setMeetings(userMeetings);

      // Load wallet balance
      setWalletBalance(getWalletBalance(user.id));
    }
  }, [user]);
  
  const handleRequestStatusUpdate = (requestId: string, status: 'accepted' | 'rejected') => {
    setCollaborationRequests((prevRequests: CollaborationRequest[]) => 
      prevRequests.map((req: CollaborationRequest) => 
        req.id === requestId ? { ...req, status } : req
      )
    );
  };
  
  if (!user) return null;
  
  const pendingRequests = collaborationRequests.filter((req: CollaborationRequest) => req.status === 'pending');
  
  return (
    <div className="space-y-6 animate-fade-in">
      <TourGuide />
      
      <div className="flex justify-between items-center" data-tour="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        
        <Link to="/investors">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-emerald-50 border border-emerald-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-full mr-4">
                <DollarSign size={20} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Wallet Balance</p>
                <h3 className="text-xl font-semibold text-emerald-900">${walletBalance.toLocaleString()}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-primary-50 border border-primary-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Requests</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingRequests.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {collaborationRequests.filter((req: CollaborationRequest) => req.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-accent-50 border border-accent-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {meetings.filter((m: Meeting) => m.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-success-50 border border-success-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Profile Views</p>
                <h3 className="text-xl font-semibold text-success-900">24</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confirmed Meetings & Collaboration requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Confirmed Meetings */}
          <Card className="glass-card border border-white/40">
            <CardHeader className="flex justify-between items-center bg-white/40 py-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-primary-600" />
                Upcoming Confirmed Meetings
              </h2>
              <Link to="/calendar" className="text-xs font-semibold text-primary-600 hover:text-primary-500">
                View Calendar
              </Link>
            </CardHeader>
            <CardBody className="p-4">
              {meetings.filter((m: Meeting) => m.status === 'accepted').length > 0 ? (
                <div className="space-y-3">
                  {meetings.filter((m: Meeting) => m.status === 'accepted').map((meet: Meeting) => {
                    const guest = findUserById(meet.inviteeId === user.id ? meet.hostId : meet.inviteeId);
                    return (
                      <div key={meet.id} className="flex items-center justify-between p-3.5 border border-gray-100 bg-white/60 rounded-xl hover-lift">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                            <Clock size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{meet.title}</h4>
                            <p className="text-xs text-gray-500">With {guest?.name} ({guest?.role})</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{meet.date} @ {meet.startTime} - {meet.endTime}</p>
                          </div>
                        </div>
                        <Badge variant="success">Confirmed</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No confirmed meetings scheduled yet.</p>
                  <Link to="/investors" className="text-xs font-semibold text-primary-600 hover:underline mt-1 inline-block">
                    Find investors to connect with &rarr;
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Collaboration requests */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
              <Badge variant="primary">{pendingRequests.length} pending</Badge>
            </CardHeader>
            
            <CardBody>
              {collaborationRequests.length > 0 ? (
                <div className="space-y-4">
                  {collaborationRequests.map((request: CollaborationRequest) => (
                    <CollaborationRequestCard
                      key={request.id}
                      request={request}
                      onStatusUpdate={handleRequestStatusUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No collaboration requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">When investors are interested in your startup, their requests will appear here</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Recommended investors */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            
            <CardBody className="space-y-4">
              {recommendedInvestors.map((investor: Investor) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  showActions={false}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};