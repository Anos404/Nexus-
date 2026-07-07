import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, Monitor, PhoneOff } from 'lucide-react';
import { User } from '../../types';

interface VideoCallOverlayProps {
  currentUser: User;
  chatPartner: User;
  onClose: (durationText: string) => void;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  currentUser,
  chatPartner,
  onClose
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connecting' | 'connected' | 'ended'>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Simulated ringing audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);

  // Play simulated ringing tone using Web Audio API (so no external assets needed!)
  const startRingingSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const playTone = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        
        // Ring tone has 2 frequencies: 440Hz and 480Hz combined
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime + 1.2);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        // Stop oscillators after 2 seconds
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch(e) {}
        }, 2000);
      };

      playTone();
      ringIntervalRef.current = setInterval(playTone, 3500);
    } catch (e) {
      console.warn("Web Audio API not supported or user gesture needed: ", e);
    }
  };

  const stopRingingSound = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Setup local video stream & simulated connection timeouts
  useEffect(() => {
    // Start ringtone
    startRingingSound();

    // Call phase transitions
    const callingTimeout = setTimeout(() => {
      setCallStatus('connecting');
      stopRingingSound();
      
      const connectingTimeout = setTimeout(() => {
        setCallStatus('connected');
      }, 2000);

      return () => clearTimeout(connectingTimeout);
    }, 4000);

    // Get webcam & microphone tracks
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.warn("Could not access camera/microphone: ", err);
      });

    return () => {
      clearTimeout(callingTimeout);
      stopRingingSound();
      // Clean up tracks
      stopAllTracks();
    };
  }, []);

  // Duration Timer
  useEffect(() => {
    if (callStatus !== 'connected') return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Handle local video element bindings when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (isVideoOff) {
        localVideoRef.current.srcObject = null;
      } else {
        localVideoRef.current.srcObject = isScreenSharing && screenStream ? screenStream : localStream;
      }
    }
  }, [localStream, screenStream, isVideoOff, isScreenSharing]);

  const stopAllTracks = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Listen for user stopping share via native browser bar
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn("Screen share cancelled or not permitted: ", err);
      }
    }
  };

  const handleEndCall = () => {
    stopAllTracks();
    setCallStatus('ended');
    const finalDuration = formatDuration(duration);
    onClose(finalDuration);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden font-sans">
      
      {/* Top Bar / Metadata */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium tracking-wide text-gray-300">
            {callStatus === 'calling' && 'Ringing...'}
            {callStatus === 'connecting' && 'Establishing Connection...'}
            {callStatus === 'connected' && 'Secure WebRTC Channel'}
          </span>
        </div>
        
        {callStatus === 'connected' && (
          <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-sm font-mono text-emerald-400">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex items-center justify-center relative p-4">
        {callStatus !== 'connected' ? (
          /* Calling / Connecting Screen */
          <div className="flex flex-col items-center text-center space-y-6 max-w-sm">
            <div className="relative">
              {/* Ripple Animation rings */}
              <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping scale-150" />
              <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping scale-125" />
              <img
                src={chatPartner.avatarUrl}
                alt={chatPartner.name}
                className="w-32 h-32 rounded-full border-4 border-primary-500 relative z-10 object-cover shadow-2xl"
              />
            </div>
            
            <div className="space-y-2 z-10">
              <h2 className="text-2xl font-semibold tracking-tight">{chatPartner.name}</h2>
              <p className="text-sm text-gray-400">
                {callStatus === 'calling' ? 'Calling...' : 'Connecting Peer-to-Peer...'}
              </p>
            </div>
          </div>
        ) : (
          /* Connected State Screen */
          <div className="w-full h-full flex items-center justify-center relative rounded-2xl overflow-hidden border border-white/5 bg-slate-900 shadow-2xl">
            {/* Screen Share rendering OR Remote Participant Display */}
            {isScreenSharing && screenStream ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
                <video
                  ref={(el) => {
                    screenVideoRef.current = el;
                    if (el && screenStream) el.srcObject = screenStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-24 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 flex items-center gap-2 text-xs">
                  <Monitor size={14} className="text-primary-400" />
                  <span>Sharing your screen</span>
                </div>
              </div>
            ) : (
              /* Remote Participant Backdrop */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950">
                <img
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  className="w-40 h-40 rounded-full border-4 border-white/10 object-cover shadow-2xl mb-4"
                />
                <h3 className="text-xl font-medium mb-1">{chatPartner.name}</h3>
                <p className="text-sm text-gray-400">In Call</p>

                {/* Simulated Audio Equalizer Visualizer */}
                <div className="flex gap-1.5 items-end justify-center h-8 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-primary-500 rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.floor(Math.random() * 24) + 8}px`,
                        animationDelay: `${i * 150}ms`,
                        animationDuration: '800ms'
                      }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Local Camera Picture-in-Picture window */}
            <div className="absolute bottom-24 right-6 w-36 h-48 sm:w-44 sm:h-60 rounded-xl overflow-hidden border-2 border-white/20 bg-slate-950 shadow-2xl transition-all duration-300 z-20">
              {isVideoOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-1">
                    <CameraOff size={16} className="text-gray-400" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]" // mirror local feed
                />
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-gray-300 backdrop-blur-sm">
                {currentUser.name} {isMuted && '(Muted)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Control Panel */}
      <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-full shadow-2xl">
          
          {/* Mute Mic Button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
              isMuted 
                ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/5 border-white/10 hover:bg-white/15 text-gray-200'
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Toggle Video Button */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
              isVideoOff 
                ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/5 border-white/10 hover:bg-white/15 text-gray-200'
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <CameraOff size={20} /> : <Camera size={20} />}
          </button>

          {/* Toggle Screen Share Button */}
          {callStatus === 'connected' && (
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
                isScreenSharing 
                  ? 'bg-primary-500 border-primary-500 text-white hover:bg-primary-600' 
                  : 'bg-white/5 border-white/10 hover:bg-white/15 text-gray-200'
              }`}
              title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
              <Monitor size={20} />
            </button>
          )}

          <div className="w-[1px] h-8 bg-white/10 mx-1" />

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all duration-200 shadow-lg shadow-red-600/30 hover:scale-105 border border-red-500"
            title="End Call"
          >
            <PhoneOff size={22} className="rotate-135" />
          </button>

        </div>
      </div>

    </div>
  );
};
