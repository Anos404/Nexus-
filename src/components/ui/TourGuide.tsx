import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Play, Info } from 'lucide-react';
import { Button } from './Button';

interface TourStep {
  target: string; // CSS selector, e.g. '[data-tour="wallet-card"]'
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  path?: string; // Redirect if on wrong path
  role?: 'entrepreneur' | 'investor' | 'all';
}

const TOUR_STORAGE_KEY = 'nexus_onboarding_completed';

export const TourGuide: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Helper to filter steps based on user role
  const getUserRole = (): 'investor' | 'entrepreneur' => {
    try {
      const stored = localStorage.getItem('business_nexus_user');
      if (stored) {
        return JSON.parse(stored).role;
      }
    } catch(e) {}
    return 'entrepreneur';
  };

  const role = getUserRole();

  // List of tour steps
  const steps: TourStep[] = [
    {
      target: '[data-tour="dashboard-header"]',
      title: 'Welcome to Business Nexus!',
      description: 'Your premium collaborative platform connecting entrepreneurs and investors. Let\'s take a 1-minute guided tour.',
      placement: 'bottom',
      path: '/dashboard/investor', // default pathways, will handle dynamically below
      role: 'all'
    },
    {
      target: '[data-tour="wallet-card"]',
      title: 'Secure Digital Wallet',
      description: 'Your PCI-compliant sandboxed wallet. Deposit funds via Stripe, withdraw to bank accounts, or execute transfers.',
      placement: 'right',
      path: '/payments',
      role: 'all'
    },
    {
      target: '[data-tour="funding-form"]',
      title: 'Venture Capital Funding',
      description: 'Acquire equity or allocate VC funds to active startups. Select a deal, enter the amount, and initiate funding instantly.',
      placement: 'left',
      path: '/payments',
      role: 'investor'
    },
    {
      target: '[data-tour="documents-section"]',
      title: 'Document Processing Chamber',
      description: 'Draft deal sheets, SAFE contracts, and Mutual NDAs. Sign contracts using the electronic signature pad with secure cryptographic receipt hashes.',
      placement: 'top',
      path: '/documents',
      role: 'all'
    },
    {
      target: '[data-tour="chat-video-info"]',
      title: 'P2P Messaging & WebRTC Video Rooms',
      description: 'Connect with partners instantly. Tap the Video icon inside chat messages to initiate peer-to-peer video calls with screen sharing.',
      placement: 'bottom',
      path: role === 'investor' ? '/chat/e1' : '/chat/i1',
      role: 'all'
    }
  ];

  const filteredSteps = steps.filter(s => s.role === 'all' || s.role === role);

  // Auto start on first login
  useEffect(() => {
    const isCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!isCompleted) {
      // Small timeout to let dashboard load
      const t = setTimeout(() => {
        setIsOpen(true);
        setCurrentStepIndex(0);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  // Update step and navigate if step has path and path does not match current path
  const currentStep = filteredSteps[currentStepIndex];

  useEffect(() => {
    if (!isOpen || !currentStep) return;

    // Check if redirect is needed
    if (currentStep.path) {
      // Dynamic adjustments for dashboard roles
      let targetPath = currentStep.path;
      if (targetPath.startsWith('/dashboard/')) {
        targetPath = `/dashboard/${role}`;
      }

      if (location.pathname !== targetPath) {
        navigate(targetPath);
        // Wait for routing & DOM load, then recalculate
        const timeout = setTimeout(() => {
          positionTooltip();
        }, 600);
        return () => clearTimeout(timeout);
      }
    }

    // Direct position computation
    const t = setTimeout(() => {
      positionTooltip();
    }, 200);

    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip);
    };
  }, [currentStepIndex, isOpen, location.pathname]);

  const positionTooltip = () => {
    if (!currentStep) return;
    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
      // Scroll target into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Fallback center of screen if element is absent
      setCoords(null);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < filteredSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    toast.success('You have completed the platform onboarding tour!', {
      icon: '🎉',
    });
  };

  // Expose triggers
  useEffect(() => {
    (window as any).restartNexusTour = () => {
      setIsOpen(true);
      setCurrentStepIndex(0);
    };
    return () => {
      delete (window as any).restartNexusTour;
    };
  }, []);

  if (!isOpen || !currentStep) return null;

  // Calculate tooltip placement styles
  const getTooltipStyle = (): React.CSSProperties => {
    if (!coords) {
      // Centered fallback
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };
    }

    const margin = 12;
    let top = 0;
    let left = 0;

    // Tooltip height is rough estimated as 180px, width 320px
    const tooltipWidth = 320;
    const tooltipHeight = 185;

    switch (currentStep.placement) {
      case 'top':
        top = coords.top - tooltipHeight - margin;
        left = coords.left + (coords.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = coords.top + coords.height + margin;
        left = coords.left + (coords.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = coords.top + (coords.height / 2) - (tooltipHeight / 2);
        left = coords.left - tooltipWidth - margin;
        break;
      case 'right':
      default:
        top = coords.top + (coords.height / 2) - (tooltipHeight / 2);
        left = coords.left + coords.width + margin;
        break;
    }

    // Restrict screen overflow boundaries
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (top < 10) top = 10;

    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 1000
    };
  };

  return (
    <>
      {/* Target element spotlight/highlight mask */}
      {coords && (
        <div 
          className="absolute border-[3px] border-primary-500 rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] pointer-events-none transition-all duration-300 z-[999]"
          style={{
            top: `${coords.top - 4}px`,
            left: `${coords.left - 4}px`,
            width: `${coords.width + 8}px`,
            height: `${coords.height + 8}px`
          }}
        />
      )}

      {/* Backdrop for center fallback steps */}
      {!coords && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[999]" />
      )}

      {/* Floating Tooltip Card */}
      <div 
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="bg-white border border-slate-200 rounded-xl shadow-2xl p-5 select-none animate-fade-in font-sans space-y-4"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600 uppercase tracking-wide">
            <Info size={14} />
            <span>Tour • Step {currentStepIndex + 1} of {filteredSteps.length}</span>
          </div>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800 leading-tight">
            {currentStep.title}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button 
            onClick={handleClose} 
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
          >
            Skip Tour
          </button>
          
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBack} 
                className="py-1 px-2.5 h-auto text-xs"
                leftIcon={<ArrowLeft size={12} />}
              >
                Back
              </Button>
            )}
            
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleNext} 
              className="py-1 px-2.5 h-auto text-xs"
              rightIcon={currentStepIndex === filteredSteps.length - 1 ? <X size={12} /> : <ArrowRight size={12} />}
            >
              {currentStepIndex === filteredSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
