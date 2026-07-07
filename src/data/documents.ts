export interface ChamberDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  ownerId: string;
  ownerName: string;
  status: 'draft' | 'in_review' | 'signed';
  assigneeId: string; // The counterparty who needs to sign
  assigneeName: string;
  content: string; // The text content of the agreement
  signatureData?: string; // base64 signature image
  signedAt?: string;
  certificateHash?: string;
}

export const initialChamberDocuments: ChamberDocument[] = [
  {
    id: 'doc-1',
    name: 'Mutual Non-Disclosure Agreement (NDA)',
    type: 'NDA',
    size: '145 KB',
    lastModified: '2026-07-04',
    shared: true,
    ownerId: 'e1', // Sarah Johnson
    ownerName: 'Sarah Johnson',
    status: 'in_review',
    assigneeId: 'i1', // Michael Rodriguez
    assigneeName: 'Michael Rodriguez',
    content: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of July 4, 2026, by and between TechWave AI, represented by Sarah Johnson ("Disclosing Party"), and Michael Rodriguez ("Receiving Party").

1. Purpose. The parties wish to explore a business opportunity of mutual interest (the "Opportunity"). In connection with the Opportunity, each party may disclose to the other certain proprietary and confidential information.

2. Confidential Information. "Confidential Information" means any information disclosed by one party to the other that is marked as confidential or should reasonably be understood to be confidential given the nature of the information.

3. Obligations of Confidentiality. The Receiving Party agrees:
   (a) To hold the Confidential Information in strict confidence.
   (b) Not to use the Confidential Information except for the purpose of evaluating the Opportunity.
   (c) Not to disclose the Confidential Information to any third party without prior written consent.

4. Term. This Agreement and the obligations here under shall remain in effect for a period of three (3) years from the date of disclosure.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.`,
  },
  {
    id: 'doc-2',
    name: 'Seed Round Term Sheet',
    type: 'Term Sheet',
    size: '280 KB',
    lastModified: '2026-07-02',
    shared: true,
    ownerId: 'i1', // Michael Rodriguez
    ownerName: 'Michael Rodriguez',
    status: 'draft',
    assigneeId: 'e1', // Sarah Johnson
    assigneeName: 'Sarah Johnson',
    content: `TERM SHEET: SERIES SEED PREFERRED STOCK

This Term Sheet summarizes the principal terms of the Series Seed Preferred Stock financing of TechWave AI, Inc.

1. Issuer: TechWave AI, Inc., a Delaware corporation (the "Company").
2. Investors: VC Innovate, represented by Michael Rodriguez (the "Investor").
3. Valuation: $10,000,000 pre-money valuation.
4. Investment Amount: $1,500,000 Series Seed Preferred Stock.
5. Liquidation Preference: Non-participating 1x liquidation preference.
6. Board of Directors: The Board shall consist of three (3) members: one designated by the Investor (Michael Rodriguez) and two designated by the common stock holders (Sarah Johnson and co-founder).
7. Exclusivity: The Company agrees to an exclusivity period of thirty (30) days from the date of signing.

This document is for discussion purposes only, except for Section 7 (Exclusivity) which is legally binding upon signature.`,
  },
  {
    id: 'doc-3',
    name: 'Simple Agreement for Future Equity (SAFE)',
    type: 'SAFE',
    size: '190 KB',
    lastModified: '2026-06-28',
    shared: true,
    ownerId: 'e3', // Maya Patel
    ownerName: 'Maya Patel',
    status: 'signed',
    assigneeId: 'i3', // Robert Torres
    assigneeName: 'Robert Torres',
    content: `SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)

THIS CERTIFIES THAT in exchange for the payment by Robert Torres (the "Investor") of $800,000 on or about June 28, 2026, HealthPulse, Inc., a Delaware corporation (the "Company"), hereby issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms set forth below.

1. Events
   (a) Equity Financing. If there is an Equity Financing before the expiration or termination of this instrument, the Company will automatically issue to the Investor a number of shares of SAFE Preferred Stock equal to the Purchase Amount divided by the Conversion Price.
   (b) Liquidity Event. If there is a Liquidity Event before the expiration or termination of this instrument, the Investor will, at its option, either (i) receive a cash payment equal to the Purchase Amount or (ii) receive a number of shares of Common Stock.

2. Valuation Cap: $8,000,000.
3. Discount Rate: 80% (20% discount).`,
    signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwCAYAAABgmxYTAAAAAXNSR0IArs4c6QAABbVJREFUeF7t11EBgDAQA8GfeKQA/56CggxskB10Zt+/Z7/gCAQIECBwigKnKGyWAQIECBD4EayshAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4TEKzT1GWKAAECBKysZAABAgROExCs09RligABAgSsrGQAAQIEThMQrNPUZYoAAQIErKxkAAECBE4T+ADreQFi/g6y0gAAAABJRU5ErkJggg==',
    signedAt: '2026-06-28T16:45:00Z',
    certificateHash: '4a8b79f8e12d3c90f23901b8e19c0a96f128c7c729ab510fb18a93e871bd0b5a'
  }
];

// In-memory repository that persists during session
let chamberDocuments = [...initialChamberDocuments];

// Load from local storage if available
const STORAGE_KEY = 'nexus_chamber_documents';
const stored = localStorage.getItem(STORAGE_KEY);
if (stored) {
  try {
    chamberDocuments = JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing stored chamber documents', e);
  }
}

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chamberDocuments));
};

export const getChamberDocuments = (): ChamberDocument[] => {
  return chamberDocuments;
};

export const getChamberDocumentById = (id: string): ChamberDocument | null => {
  return chamberDocuments.find(d => d.id === id) || null;
};

export const addChamberDocument = (doc: Omit<ChamberDocument, 'id' | 'lastModified'>): ChamberDocument => {
  const newDoc: ChamberDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    lastModified: new Date().toISOString().split('T')[0]
  };
  chamberDocuments.unshift(newDoc);
  persist();
  return newDoc;
};

export const updateChamberDocumentStatus = (
  id: string, 
  status: 'draft' | 'in_review' | 'signed'
): ChamberDocument | null => {
  const index = chamberDocuments.findIndex(d => d.id === id);
  if (index !== -1) {
    chamberDocuments[index] = {
      ...chamberDocuments[index],
      status,
      lastModified: new Date().toISOString().split('T')[0]
    };
    persist();
    return chamberDocuments[index];
  }
  return null;
};

export const signChamberDocument = (
  id: string,
  signatureData: string
): ChamberDocument | null => {
  const index = chamberDocuments.findIndex(d => d.id === id);
  if (index !== -1) {
    // Generate a mock SHA-256 certificate hash
    const randomHash = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    chamberDocuments[index] = {
      ...chamberDocuments[index],
      status: 'signed',
      signatureData,
      signedAt: new Date().toISOString(),
      certificateHash: randomHash,
      lastModified: new Date().toISOString().split('T')[0]
    };
    persist();
    return chamberDocuments[index];
  }
  return null;
};

export const deleteChamberDocument = (id: string): boolean => {
  const initialLength = chamberDocuments.length;
  chamberDocuments = chamberDocuments.filter(d => d.id !== id);
  if (chamberDocuments.length !== initialLength) {
    persist();
    return true;
  }
  return false;
};
