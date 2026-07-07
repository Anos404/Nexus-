export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'funding';
  amount: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  details?: string;
}

export interface Wallet {
  userId: string;
  balance: number;
}

// Initial mock transactions to make the UI look rich and alive
const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 500000,
    senderId: 'external-bank',
    senderName: 'SVB Operating Account',
    receiverId: 'i1', // Michael Rodriguez
    receiverName: 'Michael Rodriguez',
    status: 'completed',
    date: '2026-07-01T10:00:00Z',
    details: 'ACH Wire Deposit'
  },
  {
    id: 'tx-2',
    type: 'funding',
    amount: 150000,
    senderId: 'i1', // Michael Rodriguez
    senderName: 'Michael Rodriguez',
    receiverId: 'e1', // Sarah Johnson (TechWave AI)
    receiverName: 'Sarah Johnson (TechWave AI)',
    status: 'completed',
    date: '2026-07-03T14:20:00Z',
    details: 'TechWave AI Series A tranche'
  },
  {
    id: 'tx-3',
    type: 'deposit',
    amount: 15000,
    senderId: 'external-card',
    senderName: 'Visa ending in 4242',
    receiverId: 'e1', // Sarah Johnson
    receiverName: 'Sarah Johnson',
    status: 'completed',
    date: '2026-07-04T09:15:00Z',
    details: 'Initial Stripe deposit'
  },
  {
    id: 'tx-4',
    type: 'transfer',
    amount: 2500,
    senderId: 'e1', // Sarah Johnson
    senderName: 'Sarah Johnson',
    receiverId: 'e2', // David Chen
    receiverName: 'David Chen',
    status: 'completed',
    date: '2026-07-05T16:45:00Z',
    details: 'NDA preparation fee reimbursement'
  },
  {
    id: 'tx-5',
    type: 'withdraw',
    amount: 1200,
    senderId: 'e1', // Sarah Johnson
    senderName: 'Sarah Johnson',
    receiverId: 'external-bank',
    receiverName: 'Chase Bank Checking',
    status: 'completed',
    date: '2026-07-06T11:30:00Z',
    details: 'Withdraw to Checking'
  }
];

// Initial mock wallet balances
const initialWallets: Wallet[] = [
  { userId: 'e1', balance: 161300 }, // Sarah: 15000 + 150000 (funded) - 2500 - 1200 = 161300
  { userId: 'e2', balance: 17500 },  // David: 15000 + 2500 = 17500
  { userId: 'e3', balance: 15000 },
  { userId: 'e4', balance: 15000 },
  { userId: 'i1', balance: 350000 }, // Michael: 500000 - 150000 = 350000
  { userId: 'i2', balance: 500000 },
  { userId: 'i3', balance: 500000 }
];

const TX_STORAGE_KEY = 'nexus_transactions';
const WALLET_STORAGE_KEY = 'nexus_wallets';

// Helper to initialize local storage data if not present
const getStoredTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(TX_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(initialTransactions));
    return initialTransactions;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return initialTransactions;
  }
};

const getStoredWallets = (): Wallet[] => {
  const stored = localStorage.getItem(WALLET_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(initialWallets));
    return initialWallets;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return initialWallets;
  }
};

const saveTransactions = (txs: Transaction[]) => {
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs));
};

const saveWallets = (wallets: Wallet[]) => {
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
};

// Public APIs
export const getWalletBalance = (userId: string): number => {
  const wallets = getStoredWallets();
  const wallet = wallets.find(w => w.userId === userId);
  return wallet ? wallet.balance : 15000; // default balance
};

export const getTransactions = (userId: string): Transaction[] => {
  const txs = getStoredTransactions();
  // Return transactions where user is sender or receiver
  return txs
    .filter(tx => tx.senderId === userId || tx.receiverId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const executeDeposit = (userId: string, userName: string, amount: number, cardDetails: string): Transaction => {
  const wallets = getStoredWallets();
  const txs = getStoredTransactions();

  // Update wallet
  const walletIndex = wallets.findIndex(w => w.userId === userId);
  if (walletIndex !== -1) {
    wallets[walletIndex].balance += amount;
  } else {
    wallets.push({ userId, balance: 15000 + amount });
  }
  saveWallets(wallets);

  // Create Transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    type: 'deposit',
    amount,
    senderId: 'external-card',
    senderName: cardDetails || 'Credit Card Deposit',
    receiverId: userId,
    receiverName: userName,
    status: 'completed',
    date: new Date().toISOString(),
    details: `Stripe Ref: ch_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };

  txs.push(newTx);
  saveTransactions(txs);
  return newTx;
};

export const executeWithdrawal = (userId: string, userName: string, amount: number, bankDetails: string): Transaction => {
  const wallets = getStoredWallets();
  const txs = getStoredTransactions();

  const walletIndex = wallets.findIndex(w => w.userId === userId);
  const currentBalance = walletIndex !== -1 ? wallets[walletIndex].balance : 15000;

  if (currentBalance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  // Deduct
  if (walletIndex !== -1) {
    wallets[walletIndex].balance -= amount;
  }
  saveWallets(wallets);

  // Create Transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    type: 'withdraw',
    amount,
    senderId: userId,
    senderName: userName,
    receiverId: 'external-bank',
    receiverName: bankDetails || 'Linked Bank Account',
    status: 'completed',
    date: new Date().toISOString(),
    details: `PayPal Ref: pp_tr_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };

  txs.push(newTx);
  saveTransactions(txs);
  return newTx;
};

export const executeTransfer = (
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  amount: number,
  note?: string
): Transaction => {
  const wallets = getStoredWallets();
  const txs = getStoredTransactions();

  const senderIndex = wallets.findIndex(w => w.userId === senderId);
  const senderBalance = senderIndex !== -1 ? wallets[senderIndex].balance : 15000;

  if (senderBalance < amount) {
    throw new Error('Insufficient funds to complete transfer');
  }

  // Deduct sender
  if (senderIndex !== -1) {
    wallets[senderIndex].balance -= amount;
  }

  // Add receiver
  const receiverIndex = wallets.findIndex(w => w.userId === receiverId);
  if (receiverIndex !== -1) {
    wallets[receiverIndex].balance += amount;
  } else {
    wallets.push({ userId: receiverId, balance: 15000 + amount });
  }

  saveWallets(wallets);

  // Create Transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    type: 'transfer',
    amount,
    senderId,
    senderName,
    receiverId,
    receiverName,
    status: 'completed',
    date: new Date().toISOString(),
    details: note || 'Instant Platform Transfer'
  };

  txs.push(newTx);
  saveTransactions(txs);
  return newTx;
};

export const executeDealFunding = (
  investorId: string,
  investorName: string,
  entrepreneurId: string,
  entrepreneurName: string,
  startupName: string,
  amount: number
): Transaction => {
  const wallets = getStoredWallets();
  const txs = getStoredTransactions();

  const investorIndex = wallets.findIndex(w => w.userId === investorId);
  const investorBalance = investorIndex !== -1 ? wallets[investorIndex].balance : 500000;

  if (investorBalance < amount) {
    throw new Error('Insufficient funds to complete deal investment');
  }

  // Deduct investor
  if (investorIndex !== -1) {
    wallets[investorIndex].balance -= amount;
  }

  // Add entrepreneur
  const entrepreneurIndex = wallets.findIndex(w => w.userId === entrepreneurId);
  if (entrepreneurIndex !== -1) {
    wallets[entrepreneurIndex].balance += amount;
  } else {
    wallets.push({ userId: entrepreneurId, balance: 15000 + amount });
  }

  saveWallets(wallets);

  // Create Transaction
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    type: 'funding',
    amount,
    senderId: investorId,
    senderName: investorName,
    receiverId: entrepreneurId,
    receiverName: `${entrepreneurName} (${startupName})`,
    status: 'completed',
    date: new Date().toISOString(),
    details: `Investment Capital for ${startupName}`
  };

  txs.push(newTx);
  saveTransactions(txs);
  return newTx;
};
