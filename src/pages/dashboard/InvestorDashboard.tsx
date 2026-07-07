import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Filter, Search, PlusCircle, Calendar, Clock, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur, Meeting } from '../../types';
import { entrepreneurs, findUserById } from '../../data/users';
import { getRequestsFromInvestor } from '../../data/collaborationRequests';
import { getMeetingsForUser } from '../../data/meetings';
import { getWalletBalance } from '../../data/payments';
import { TourGuide } from '../../components/ui/TourGuide';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  
  useEffect(() => {
    if (user) {
      const userMeetings = getMeetingsForUser(user.id);
      setMeetings(userMeetings);
      setWalletBalance(getWalletBalance(user.id));
    }
  }, [user]);

  if (!user) return null;
  
  // Get collaboration requests sent by this investor
  const sentRequests = getRequestsFromInvestor(user.id);
  const requestedEntrepreneurIds = sentRequests.map(req => req.entrepreneurId);
  
  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.pitchSummary.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Industry filter
    const matchesIndustry = selectedIndustries.length === 0 || 
      selectedIndustries.includes(entrepreneur.industry);
    
    return matchesSearch && matchesIndustry;
  });
  
  // Get unique industries for filter
  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry)));
  
  // Toggle industry selection
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prevSelected => 
      prevSelected.includes(industry)
        ? prevSelected.filter(i => i !== industry)
        : [...prevSelected, industry]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <TourGuide />
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4" data-tour="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        
        <Link to="/entrepreneurs">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            View All Startups
          </Button>
        </Link>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <Badge
                  key={industry}
                  variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                  className="cursor-pointer"
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border border-emerald-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-full mr-4">
                <DollarSign size={20} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Available Wallet Balance</p>
                <h3 className="text-xl font-semibold text-emerald-900">${walletBalance.toLocaleString()}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-primary-50 border border-primary-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-accent-50 border border-accent-100 hover-lift">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {sentRequests.filter(req => req.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Featured Startups and Calendar Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Startups */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="py-4 bg-white/50">
              <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
            </CardHeader>
            
            <CardBody>
              {filteredEntrepreneurs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredEntrepreneurs.map(entrepreneur => (
                    <EntrepreneurCard
                      key={entrepreneur.id}
                      entrepreneur={entrepreneur}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No startups match your filters</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndustries([]);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Confirmed Meetings Sidepanel */}
        <div className="space-y-4">
          <Card className="glass-card border border-white/40 shadow-sm">
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
                      <div key={meet.id} className="flex flex-col p-3 border border-gray-100 bg-white/60 rounded-xl hover-lift space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">{meet.title}</h4>
                          <Badge variant="success">Confirmed</Badge>
                        </div>
                        <p className="text-[10px] text-gray-500">With {guest?.name} ({guest?.role})</p>
                        <div className="flex justify-between items-center text-[9px] text-gray-400">
                          <span className="flex items-center gap-0.5"><Clock size={10} /> {meet.startTime} - {meet.endTime}</span>
                          <span>{meet.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No confirmed meetings scheduled yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Visit entrepreneur profiles to book scheduling slots.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};