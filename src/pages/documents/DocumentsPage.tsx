import React, { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Trash2, Share2, PenTool, 
  CheckCircle, Clock, ShieldCheck, FileCheck, ArrowRight 
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { users as allUsers } from '../../data/users';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { SignaturePad } from '../../components/ui/SignaturePad';
import { 
  getChamberDocuments, 
  addChamberDocument, 
  updateChamberDocumentStatus, 
  signChamberDocument, 
  deleteChamberDocument,
  ChamberDocument
} from '../../data/documents';

// Original generic files data
const initialGenericDocuments = [
  {
    id: 1,
    name: 'Pitch Deck 2024.pdf',
    type: 'PDF',
    size: '2.4 MB',
    lastModified: '2024-02-15',
    shared: true
  },
  {
    id: 2,
    name: 'Financial Projections.xlsx',
    type: 'Spreadsheet',
    size: '1.8 MB',
    lastModified: '2024-02-10',
    shared: false
  },
  {
    id: 3,
    name: 'Business Plan.docx',
    type: 'Document',
    size: '3.2 MB',
    lastModified: '2024-02-05',
    shared: true
  },
  {
    id: 4,
    name: 'Market Research.pdf',
    type: 'PDF',
    size: '5.1 MB',
    lastModified: '2024-01-28',
    shared: false
  }
];

export const DocumentsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_files' | 'chamber'>('my_files');
  const [genericDocs, setGenericDocs] = useState(initialGenericDocuments);
  const [chamberDocs, setChamberDocs] = useState<ChamberDocument[]>(getChamberDocuments());
  const [selectedDoc, setSelectedDoc] = useState<ChamberDocument | null>(
    getChamberDocuments().length > 0 ? getChamberDocuments()[0] : null
  );
  
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  if (!currentUser) return null;

  // Dropzone for regular files (Tab 1)
  const onDropGeneric = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        lastModified: new Date().toISOString().split('T')[0],
        shared: false
      };
      setGenericDocs(prev => [newDoc, ...prev]);
      toast.success(`Uploaded ${file.name}`);
    });
  }, []);

  const { 
    getRootProps: getGenericRoot, 
    getInputProps: getGenericInput, 
    isDragActive: isGenericDragActive 
  } = useDropzone({ onDrop: onDropGeneric });

  // Dropzone for Chamber Contracts (Tab 2)
  const onDropChamber = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const newDoc = addChamberDocument({
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        shared: true,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        status: 'draft',
        assigneeId: '',
        assigneeName: '',
        content: `MOCKED UPLOADED AGREEMENT CONTRACT: ${file.name}

This agreement is uploaded by ${currentUser.name} for deal processing. 

1. Covenant. The parties agree to act in good faith and execute the transactions outlined in the terms attached.
2. Confidentiality. The terms of this transaction are confidential and proprietary to the parties involved.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement.`
      });
      setChamberDocs(getChamberDocuments());
      setSelectedDoc(newDoc);
      toast.success(`Uploaded contract draft: ${file.name}`);
    });
  }, [currentUser]);

  const { 
    getRootProps: getChamberRoot, 
    getInputProps: getChamberInput, 
    isDragActive: isChamberDragActive 
  } = useDropzone({ onDrop: onDropChamber });

  // Template instantiation
  const handleDraftFromTemplate = (templateType: 'NDA' | 'TermSheet' | 'SAFE') => {
    let name = '';
    let type = '';
    let content = '';

    if (templateType === 'NDA') {
      name = 'Mutual Non-Disclosure Agreement (NDA)';
      type = 'NDA';
      content = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into by and between the owner of the document and the counterparty assigned.

1. Purpose. The parties wish to explore a business opportunity of mutual interest (the "Opportunity"). In connection with the Opportunity, each party may disclose to the other certain proprietary and confidential information.

2. Confidential Information. "Confidential Information" means any information disclosed by one party to the other that is marked as confidential or should reasonably be understood to be confidential given the nature of the information.

3. Obligations of Confidentiality. The Receiving Party agrees to hold the Confidential Information in strict confidence and to not disclose the Confidential Information to any third party without prior written consent.

IN WITNESS WHEREOF, the parties have executed this Agreement.`;
    } else if (templateType === 'TermSheet') {
      name = 'Seed Capital Term Sheet';
      type = 'Term Sheet';
      content = `TERM SHEET: SERIES SEED PREFERRED STOCK

This Term Sheet summarizes the principal terms of the proposed Preferred Stock financing.

1. Valuation: $8,000,000 pre-money valuation.
2. Investment Amount: $1,000,000 Series Seed Capital.
3. Liquidation Preference: Non-participating 1x liquidation preference.
4. Exclusivity: The Company agrees to an exclusivity period of thirty (30) days from signing.

IN WITNESS WHEREOF, the parties have executed this Agreement.`;
    } else {
      name = 'Simple Agreement for Future Equity (SAFE)';
      type = 'SAFE';
      content = `SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)

THIS CERTIFIES THAT in exchange for investment capital, the Company hereby issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms set forth below.

1. Events
   (a) Equity Financing. Convert to preferred shares automatically upon the next qualified equity financing.
   (b) Valuation Cap. $6,000,000.
   (c) Discount Rate. 80% (20% discount).

IN WITNESS WHEREOF, the parties have executed this Agreement.`;
    }

    const newDoc = addChamberDocument({
      name,
      type,
      size: '115 KB',
      shared: true,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      status: 'draft',
      assigneeId: '',
      assigneeName: '',
      content
    });

    setChamberDocs(getChamberDocuments());
    setSelectedDoc(newDoc);
    setSelectedAssigneeId('');
    toast.success(`Drafted ${type} Template!`);
  };

  const handleSendForReview = (assigneeId: string) => {
    if (!selectedDoc) return;
    const assignee = allUsers.find(u => u.id === assigneeId);
    if (!assignee) return;

    // Update in mock DB
    const updated = updateChamberDocumentStatus(selectedDoc.id, 'in_review');
    if (updated) {
      updated.assigneeId = assignee.id;
      updated.assigneeName = assignee.name;
      
      // Update local storage/memory
      setChamberDocs(getChamberDocuments());
      setSelectedDoc({ ...updated });
      toast.success(`Document sent to ${assignee.name} for review!`);
    }
  };

  const handleSignDocument = (signatureData: string) => {
    if (!selectedDoc) return;
    const signed = signChamberDocument(selectedDoc.id, signatureData);
    if (signed) {
      setChamberDocs(getChamberDocuments());
      setSelectedDoc({ ...signed });
      setShowSignaturePad(false);
      toast.success('Document digitally signed successfully!');
    }
  };

  const handleDeleteDoc = (id: string) => {
    const success = deleteChamberDocument(id);
    if (success) {
      const remaining = getChamberDocuments();
      setChamberDocs(remaining);
      setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
      toast.success('Contract deleted');
    }
  };

  const getStatusBadge = (status: 'draft' | 'in_review' | 'signed') => {
    switch (status) {
      case 'signed':
        return <Badge variant="success">Signed</Badge>;
      case 'in_review':
        return <Badge variant="primary">In Review</Badge>;
      case 'draft':
      default:
        return <Badge variant="gray">Draft</Badge>;
    }
  };

  const potentialAssignees = allUsers.filter(u => u.id !== currentUser.id);

  return (
    <div className="space-y-6 animate-fade-in" data-tour="documents-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Processing Chamber</h1>
          <p className="text-gray-600">Collaborate, review, and digitally sign startup agreements</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-150 p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('my_files')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activeTab === 'my_files'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            My Files
          </button>
          <button
            onClick={() => setActiveTab('chamber')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'chamber'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <PenTool size={15} /> Chamber Contracts
          </button>
        </div>
      </div>

      {activeTab === 'my_files' ? (
        /* ==================== TAB 1: GENERAL FILES ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Storage Information Widget */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Storage</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used</span>
                  <span className="font-medium text-gray-900">12.5 GB</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-primary-600 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-gray-900">7.5 GB</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Access</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    Recent Files
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    Shared with Me
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    Starred
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md text-red-600 font-medium">
                    Trash Bin
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Document list */}
          <div className="lg:col-span-3 space-y-4">
            <div 
              {...getGenericRoot()} 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                isGenericDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-white'
              }`}
            >
              <input {...getGenericInput()} />
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm font-medium text-gray-800">Drag and drop file here, or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">Supports PDF, XLSX, DOCX up to 10MB</p>
            </div>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">All Files</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {genericDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors duration-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText size={24} className="text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          {doc.shared && (
                            <Badge variant="secondary" size="sm">Shared</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>Modified {doc.lastModified}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm" className="p-2" aria-label="Download">
                          <Download size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2" aria-label="Share">
                          <Share2 size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2 text-error-600 hover:text-error-700" 
                          aria-label="Delete"
                          onClick={() => setGenericDocs(prev => prev.filter(d => d.id !== doc.id))}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        /* ==================== TAB 2: DOCUMENT CHAMBER ==================== */
        <div className="space-y-6">
          
          {/* Templates drafting dock */}
          <Card className="bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
            <CardBody className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-primary-900 flex items-center gap-2">
                    <PenTool size={18} /> Instantly Draft Deal Agreements
                  </h3>
                  <p className="text-xs text-primary-700 mt-0.5">Select a template to generate a pre-formatted startup legal draft.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDraftFromTemplate('NDA')}>
                    + Mutual NDA
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDraftFromTemplate('TermSheet')}>
                    + Seed Term Sheet
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDraftFromTemplate('SAFE')}>
                    + SAFE Equity
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left panel: Active Chamber Contracts */}
            <div className="lg:col-span-5 space-y-4">
              
              <div 
                {...getChamberRoot()} 
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ${
                  isChamberDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-white'
                }`}
              >
                <input {...getChamberInput()} />
                <Upload className="mx-auto text-gray-400 mb-1" size={24} />
                <p className="text-xs font-semibold text-gray-800">Drag in custom contract drafts</p>
                <p className="text-[10px] text-gray-500">PDF, DOCX will be converted to editable Chamber text</p>
              </div>

              <Card>
                <CardHeader>
                  <h2 className="text-base font-semibold text-gray-900">Active Deals / Contracts</h2>
                </CardHeader>
                <CardBody className="p-0">
                  {chamberDocs.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 text-sm">
                      No documents drafted. Generate a template above to begin.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {chamberDocs.map(doc => {
                        const isSelected = selectedDoc?.id === doc.id;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setSelectedDoc(doc);
                              setSelectedAssigneeId('');
                              setShowSignaturePad(false);
                            }}
                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-all flex items-start justify-between ${
                              isSelected ? 'bg-primary-50/50 border-l-4 border-primary-600' : ''
                            }`}
                          >
                            <div className="space-y-1 min-w-0 pr-3">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {doc.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Initiated by: {doc.ownerId === currentUser.id ? 'You' : doc.ownerName}
                              </p>
                              {doc.assigneeName && (
                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                  <span>Signer:</span>
                                  <span className="font-medium text-slate-800">{doc.assigneeName}</span>
                                </p>
                              )}
                              <p className="text-[10px] text-gray-400">Modified: {doc.lastModified}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(doc.status)}
                              {doc.ownerId === currentUser.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDoc(doc.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1"
                                  title="Delete Contract"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right panel: Active Preview & Signing Board */}
            <div className="lg:col-span-7">
              {selectedDoc ? (
                <div className="space-y-4">
                  
                  {/* Status Pipeline Timeline */}
                  <Card>
                    <CardBody className="p-4">
                      <div className="flex justify-between items-center text-[11px] font-semibold">
                        <div className="flex items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            selectedDoc.status === 'draft' || selectedDoc.status === 'in_review' || selectedDoc.status === 'signed'
                              ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>1</div>
                          <span className={selectedDoc.status === 'draft' ? 'text-primary-700' : 'text-gray-500'}>Draft</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-gray-200 mx-2" />
                        <div className="flex items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            selectedDoc.status === 'in_review' || selectedDoc.status === 'signed'
                              ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>2</div>
                          <span className={selectedDoc.status === 'in_review' ? 'text-primary-700' : 'text-gray-500'}>In Review</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-gray-200 mx-2" />
                        <div className="flex items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            selectedDoc.status === 'signed'
                              ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>3</div>
                          <span className={selectedDoc.status === 'signed' ? 'text-emerald-700' : 'text-gray-500'}>Signed</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Main Preview Board */}
                  <Card className="shadow-lg border border-slate-200">
                    <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between bg-slate-50">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                          {selectedDoc.name}
                        </h3>
                        <p className="text-xs text-gray-500">ID: {selectedDoc.id} | Size: {selectedDoc.size}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedDoc.status === 'signed' && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle size={12} /> SECURE
                          </Badge>
                        )}
                        <span className="text-xs font-mono font-medium text-slate-500">
                          {selectedDoc.type}
                        </span>
                      </div>
                    </CardHeader>

                    {/* Paper Document Preview Layout */}
                    <div className="p-6 bg-slate-100/50">
                      <div className="bg-white border border-slate-300 shadow-md p-8 rounded font-serif text-sm leading-relaxed text-gray-800 max-h-[400px] overflow-y-auto whitespace-pre-wrap select-text">
                        {selectedDoc.content}

                        {/* Signature Render Section */}
                        {selectedDoc.status === 'signed' && selectedDoc.signatureData && (
                          <div className="mt-8 pt-8 border-t border-dashed border-gray-300 flex justify-between items-end">
                            <div>
                              <p className="text-xs text-gray-500 font-sans">Owner / Representative:</p>
                              <p className="text-sm font-semibold text-gray-800 font-sans">{selectedDoc.ownerName}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-sans">Digitally Signed By:</p>
                              <div className="my-1 flex justify-end">
                                <img
                                  src={selectedDoc.signatureData}
                                  alt="Digital Signature"
                                  className="h-12 max-w-[150px] object-contain border border-dashed border-emerald-300 rounded bg-emerald-50/20"
                                />
                              </div>
                              <p className="text-sm font-semibold text-gray-800 font-sans">{selectedDoc.assigneeName}</p>
                              <p className="text-[9px] text-gray-400 font-sans font-mono">
                                Signed: {new Date(selectedDoc.signedAt || '').toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cryptographic Signature Certificate (tamper-evident panel) */}
                      {selectedDoc.status === 'signed' && selectedDoc.certificateHash && (
                        <div className="mt-4 border border-emerald-500 bg-emerald-50/50 p-4 rounded-lg flex items-start gap-3 text-emerald-950 shadow-sm animate-fade-in">
                          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full mt-0.5">
                            <ShieldCheck size={18} />
                          </div>
                          <div className="space-y-1 text-xs">
                            <h4 className="font-bold tracking-tight">Verified Digital Signature Certificate</h4>
                            <p className="text-gray-700">This agreement was digitally authorized and sealed under SHA-256 encryption. The signatures are legally binding.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-600 bg-white/70 p-2 rounded border border-emerald-200/50 mt-1">
                              <div>Signer ID: {selectedDoc.assigneeId}</div>
                              <div>Auth Mechanism: Nexus PKI</div>
                              <div>IP Location: 204.148.12.18 (Simulator)</div>
                              <div className="truncate col-span-1 sm:col-span-2 text-emerald-800">
                                Cert Hash: {selectedDoc.certificateHash}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Signing Actions Control Bar */}
                    <CardBody className="border-t border-gray-100 bg-white">
                      
                      {/* DRAFT STATE: Assign Counterparty and Send */}
                      {selectedDoc.status === 'draft' && selectedDoc.ownerId === currentUser.id && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-700">
                              Choose Signer / Counterparty
                            </label>
                            <select
                              value={selectedAssigneeId}
                              onChange={(e) => setSelectedAssigneeId(e.target.value)}
                              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border bg-white"
                            >
                              <option value="">Select partner user...</option>
                              {potentialAssignees.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.role === 'investor' ? 'Investor' : 'Entrepreneur'})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            disabled={!selectedAssigneeId}
                            onClick={() => handleSendForReview(selectedAssigneeId)}
                            rightIcon={<ArrowRight size={16} />}
                          >
                            Send Contract for Review
                          </Button>
                        </div>
                      )}

                      {/* IN REVIEW STATE: Assignee signature flow */}
                      {selectedDoc.status === 'in_review' && (
                        <div>
                          {selectedDoc.assigneeId === currentUser.id ? (
                            <div className="space-y-4">
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                                <Clock size={16} className="text-amber-600 flex-shrink-0" />
                                <span>You have been requested to review and sign this agreement. Use the signature box below.</span>
                              </div>
                              
                              {!showSignaturePad ? (
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  fullWidth
                                  onClick={() => setShowSignaturePad(true)}
                                  leftIcon={<PenTool size={16} />}
                                >
                                  Sign This Document
                                </Button>
                              ) : (
                                <SignaturePad
                                  onSave={handleSignDocument}
                                  onCancel={() => setShowSignaturePad(false)}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm flex items-center justify-center gap-2">
                              <Clock size={18} className="text-slate-400 animate-pulse" />
                              <span>Waiting for signature from <strong>{selectedDoc.assigneeName}</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SIGNED STATE: Completed View */}
                      {selectedDoc.status === 'signed' && (
                        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck size={18} className="text-emerald-600" />
                            <span>Signed agreement executed by all parties.</span>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            leftIcon={<Download size={14} />}
                            onClick={() => {
                              toast.success('Downloaded Signed PDF Archive!');
                            }}
                          >
                            Download Archive
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl bg-slate-50/30 p-12 text-center text-gray-500">
                  <div>
                    <FileText className="mx-auto text-gray-300 mb-2" size={48} />
                    <h3>No Contract Selected</h3>
                    <p className="text-xs text-gray-400 mt-1">Select a contract from the list to view its terms or execute signatures.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};