import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, 
  Send, History, Shield, CheckCircle, AlertCircle, Sparkles, Building
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { 
  getWalletBalance, 
  getTransactions, 
  executeDeposit, 
  executeWithdrawal, 
  executeTransfer, 
  executeDealFunding,
  Transaction 
} from '../../data/payments';
import { entrepreneurs } from '../../data/users';
import toast from 'react-hot-toast';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'deposits' | 'withdrawals' | 'transfers' | 'funding'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transaction Forms
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCard, setDepositCard] = useState('');
  const [depositExpiry, setDepositExpiry] = useState('');
  const [depositCVV, setDepositCVV] = useState('');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawRouting, setWithdrawRouting] = useState('');
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferNote, setTransferNote] = useState('');
  
  // Deal Funding Form (Investor only)
  const [fundAmount, setFundAmount] = useState('');
  const [selectedStartupId, setSelectedStartupId] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState<any>(null);

  // Load user wallet
  const reloadWalletData = () => {
    if (user) {
      setBalance(getWalletBalance(user.id));
      setTransactions(getTransactions(user.id));
    }
  };

  useEffect(() => {
    reloadWalletData();
  }, [user]);

  if (!user) return null;

  // Form Handlers
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }
    
    try {
      const cardMasked = `Visa ending in *${depositCard.slice(-4) || '4242'}`;
      executeDeposit(user.id, user.name, amt, cardMasked);
      toast.success(`Successfully deposited $${amt.toLocaleString()} via Stripe!`);
      setDepositAmount('');
      setDepositCard('');
      setDepositExpiry('');
      setDepositCVV('');
      reloadWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Deposit failed');
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }
    if (amt > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    try {
      const bankMasked = `${withdrawBank || 'Chase checking'} (Routing: *${withdrawRouting.slice(-4) || '1210'})`;
      executeWithdrawal(user.id, user.name, amt, bankMasked);
      toast.success(`Successfully initiated withdrawal of $${amt.toLocaleString()} to your bank!`);
      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawRouting('');
      reloadWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed');
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }
    if (amt > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    // Try finding matching user by email or ID
    const recipient = entrepreneurs.find(
      e => e.email.toLowerCase() === transferRecipient.toLowerCase() || e.name.toLowerCase() === transferRecipient.toLowerCase()
    );

    if (!recipient) {
      toast.error('Recipient not found on the platform. Try "sarah@techwave.io" or "Sarah Johnson"');
      return;
    }

    try {
      executeTransfer(user.id, user.name, recipient.id, recipient.name, amt, transferNote);
      toast.success(`Transferred $${amt.toLocaleString()} to ${recipient.name} successfully!`);
      setTransferAmount('');
      setTransferRecipient('');
      setTransferNote('');
      reloadWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    }
  };

  const handleFundDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }
    if (amt > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    const startup = entrepreneurs.find(ent => ent.id === selectedStartupId);
    if (!startup) {
      toast.error('Please select a startup deal to fund');
      return;
    }

    try {
      executeDealFunding(user.id, user.name, startup.id, startup.name, startup.startupName, amt);
      setCelebrationDetails({
        startupName: startup.startupName,
        amount: amt,
        recipient: startup.name
      });
      setShowCelebration(true);
      setFundAmount('');
      setSelectedStartupId('');
      reloadWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Investment failed');
    }
  };

  // Filtered transactions list
  const filteredTransactions = transactions.filter(tx => {
    // Tab filter
    if (activeSubTab === 'deposits' && tx.type !== 'deposit') return false;
    if (activeSubTab === 'withdrawals' && tx.type !== 'withdraw') return false;
    if (activeSubTab === 'transfers' && tx.type !== 'transfer') return false;
    if (activeSubTab === 'funding' && tx.type !== 'funding') return false;

    // Search query
    const matchQuery = 
      tx.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.details && tx.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery);

    return matchQuery;
  });

  const getTxBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="success">Deposit</Badge>;
      case 'withdraw':
        return <Badge variant="accent">Withdrawal</Badge>;
      case 'transfer':
        return <Badge variant="primary">Transfer</Badge>;
      case 'funding':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Deal Funded</Badge>;
      default:
        return <Badge variant="gray">Other</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-tour="payments-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet & Financial Chamber</h1>
          <p className="text-gray-600">Simulate investments, top-ups, and bank wire transfers safely</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-100 border border-slate-200 px-4 py-2 rounded-full">
          <Shield size={16} className="text-emerald-600" />
          <span>PCI-DSS Compliant Sandboxed Channel</span>
        </div>
      </div>

      {/* Celebration Modal Overlay */}
      {showCelebration && celebrationDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top Confetti Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary-300/30 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-300/30 rounded-full blur-2xl animate-pulse" />
            
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 text-emerald-600">
              <Sparkles size={32} className="animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Investment Finalized!</h3>
              <p className="text-sm text-slate-600">
                You have successfully allocated mock venture capital funds to the startup's growth trajectory.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Venture Startup:</span>
                <span className="font-semibold text-slate-800">{celebrationDetails.startupName}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Entrepreneur Representative:</span>
                <span className="font-semibold text-slate-800">{celebrationDetails.recipient}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Tranche Funded:</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">
                  ${celebrationDetails.amount.toLocaleString()} USD
                </span>
              </div>
            </div>

            <Button 
              fullWidth 
              variant="primary" 
              onClick={() => setShowCelebration(false)}
            >
              Continue back to Wallet
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Card details + balance trend + actions form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Balance display & visual credit card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* High Fidelity Visa Card Preview */}
          <div className="relative h-60 w-full rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl p-6 flex flex-col justify-between overflow-hidden border border-white/10 hover-scale" data-tour="wallet-card">
            {/* Visual background patterns */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl" />

            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Nexus Vault Balance</p>
                <h2 className="text-4xl font-extrabold font-mono text-white mt-1">
                  ${balance.toLocaleString()}
                </h2>
              </div>
              <div className="h-8 w-12 bg-white/5 backdrop-blur border border-white/10 rounded flex items-center justify-center text-xs font-bold text-slate-300">
                DEAL
              </div>
            </div>

            {/* Card Number Mock */}
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-400 tracking-wider">SECURE DIGITAL ACCOUNT</p>
              <h3 className="text-lg font-mono text-white tracking-widest">
                4000 &nbsp; 1282 &nbsp; 9928 &nbsp; {user.role === 'investor' ? '8812' : '3491'}
              </h3>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] uppercase text-slate-400">Account Owner</p>
                <p className="text-sm font-semibold text-slate-200 truncate max-w-[200px]">{user.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase text-slate-400">Card Platform</p>
                <p className="text-sm font-bold tracking-wide text-indigo-400 flex items-center gap-1">
                  <CreditCard size={16} /> Stripe Mock
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <Card>
            <CardBody className="p-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <ArrowUpRight size={14} className="text-emerald-500" />
                  <span>Total Inflow</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  ${transactions
                    .filter(tx => tx.receiverId === user.id)
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString()}
                </h4>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <ArrowDownLeft size={14} className="text-red-500" />
                  <span>Total Outflow</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  ${transactions
                    .filter(tx => tx.senderId === user.id)
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString()}
                </h4>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right column: Action forms (Tabs inside a card) */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100">
              <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-primary-600" /> Make a Sandboxed Transaction
              </h2>
            </CardHeader>
            <CardBody className="p-6">
              {/* Conditional options for Investor vs Entrepreneur */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6">
                <button
                  onClick={() => setActiveSubTab('deposits')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                    activeSubTab === 'deposits' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Stripe Deposit
                </button>
                <button
                  onClick={() => setActiveSubTab('withdrawals')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                    activeSubTab === 'withdrawals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Withdraw Bank
                </button>
                <button
                  onClick={() => setActiveSubTab('transfers')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                    activeSubTab === 'transfers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Transfer P2P
                </button>
              </div>

              {/* Action Form Blocks */}
              {activeSubTab === 'deposits' && (
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600">Simulated Card Provider</label>
                    <div className="flex gap-2 p-2 border border-slate-200 rounded bg-slate-50 text-slate-600 text-xs">
                      <span className="font-bold text-primary-600">STRIPE PROV</span>
                      <span>• Sandbox simulation network</span>
                    </div>
                  </div>

                  <Input
                    label="Amount (USD)"
                    type="number"
                    placeholder="Enter deposit amount e.g. 5000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    startAdornment={<DollarSign size={16} />}
                  />
                  
                  <Input
                    label="Card Number"
                    type="text"
                    maxLength={16}
                    placeholder="4242 4242 4242 4242"
                    value={depositCard}
                    onChange={(e) => setDepositCard(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={depositExpiry}
                      onChange={(e) => setDepositExpiry(e.target.value)}
                      required
                    />
                    <Input
                      label="CVV Code"
                      type="password"
                      maxLength={3}
                      placeholder="***"
                      value={depositCVV}
                      onChange={(e) => setDepositCVV(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" fullWidth>
                    Top Up Wallet Balance
                  </Button>
                </form>
              )}

              {activeSubTab === 'withdrawals' && (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <Input
                    label="Withdrawal Amount (USD)"
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    startAdornment={<DollarSign size={16} />}
                  />

                  <Input
                    label="Recipient Bank Name"
                    placeholder="e.g. Chase Bank, SVB, Bank of America"
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    required
                  />

                  <Input
                    label="Bank Routing Number"
                    maxLength={9}
                    placeholder="9-digit Routing Number"
                    value={withdrawRouting}
                    onChange={(e) => setWithdrawRouting(e.target.value)}
                    required
                  />

                  <Button type="submit" fullWidth>
                    Initiate Wire Outflow
                  </Button>
                </form>
              )}

              {activeSubTab === 'transfers' && (
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <InfoIcon /> Transfer sandbox targets
                    </span>
                    <span>To test P2P Transfer, enter any user's name or email. For example, type <strong>Sarah Johnson</strong> or <strong>sarah@techwave.io</strong></span>
                  </div>

                  <Input
                    label="Recipient Username / Email"
                    placeholder="Name or email address"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    required
                  />

                  <Input
                    label="Transfer Amount (USD)"
                    type="number"
                    placeholder="Enter amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    startAdornment={<DollarSign size={16} />}
                  />

                  <Input
                    label="Memo / Note"
                    placeholder="Agreement fee / NDA consult etc."
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                  />

                  <Button type="submit" fullWidth>
                    Send Instant Transfer
                  </Button>
                </form>
              )}

              {/* Deal Funding Flow (Accessible to Investors, or display a promotional message to Entrepreneurs) */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                {user.role === 'investor' ? (
                  <form onSubmit={handleFundDeal} className="space-y-4" data-tour="funding-form">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" /> Direct Startup Capital Funding (Investor-only)
                    </h3>
                    
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">Select Deal / Startup</label>
                      <select 
                        className="w-full p-2.5 border border-slate-200 rounded-md bg-white text-sm"
                        value={selectedStartupId}
                        onChange={(e) => setSelectedStartupId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Startup --</option>
                        {entrepreneurs.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.startupName} ({e.name}) - Funding Needed: {e.fundingNeeded}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Capital Invested Amount (USD)"
                      type="number"
                      placeholder="e.g. 150000"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      required
                      startAdornment={<DollarSign size={16} />}
                    />

                    <Button type="submit" fullWidth variant="primary" className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-semibold">
                      Confirm & Fund Tranche Deal
                    </Button>
                  </form>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3">
                    <Building className="text-primary-600 mt-1" size={20} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">Venture Deals Portal Enabled</h4>
                      <p className="text-[11px] text-slate-500">
                        As an entrepreneur, your funding deals are visible to accredited investors. When investors execute deal investments, your wallet balance will receive the funds automatically!
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </CardBody>
          </Card>
        </div>

      </div>

      {/* Transactions Ledger Panel */}
      <Card data-tour="transactions-table">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            <History size={18} className="text-primary-600" /> Transaction Ledger
          </h2>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                activeSubTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveSubTab('deposits')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                activeSubTab === 'deposits' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setActiveSubTab('withdrawals')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                activeSubTab === 'withdrawals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Withdrawals
            </button>
            <button
              onClick={() => setActiveSubTab('transfers')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                activeSubTab === 'transfers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Transfers
            </button>
            <button
              onClick={() => setActiveSubTab('funding')}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                activeSubTab === 'funding' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Funding
            </button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Search filter input */}
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left font-medium text-slate-500">
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Sender</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Memo Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No transactions matches your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => {
                      const isReceive = tx.receiverId === user.id;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-xs text-slate-500">{tx.id}</td>
                          <td className="p-3">{getTxBadge(tx.type)}</td>
                          <td className="p-3 font-medium text-slate-700">{tx.senderName}</td>
                          <td className="p-3 font-medium text-slate-700">{tx.receiverName}</td>
                          <td className="p-3 font-semibold font-mono">
                            <span className={isReceive ? 'text-emerald-600' : 'text-slate-800'}>
                              {isReceive ? '+' : '-'}${tx.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-xs">
                            {new Date(tx.date).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-600 text-xs">{tx.details || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);
