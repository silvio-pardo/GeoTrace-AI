import React from 'react';
import { AlertTriangle, WifiOff, X } from 'lucide-react';

interface NotificationBannerProps {
  errorMessage: string | null;
  isOffline: boolean;
  isOfflineDismissed: boolean;
  onDismissError: () => void;
  onDismissOffline: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  errorMessage,
  isOffline,
  isOfflineDismissed,
  onDismissError,
  onDismissOffline
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-[3000] flex flex-col items-stretch animate-in slide-in-from-top duration-300 pointer-events-none">
      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 shadow-xl flex items-center justify-between border-b border-red-500/30 backdrop-blur-xl pointer-events-auto">
           <div className="flex-1 flex justify-center items-center gap-3">
             <AlertTriangle className="w-4 h-4" />
             <span className="truncate max-w-[calc(100vw-100px)]">{errorMessage}</span>
           </div>
           <button 
            onClick={onDismissError}
            className="hover:bg-black/10 p-1.5 rounded-full transition-colors ml-4"
            title="Dismiss Error"
           >
             <X className="w-4 h-4" />
           </button>
         </div>
      )}

      {/* Offline Banner */}
      {isOffline && !isOfflineDismissed && (
         <div className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 shadow-xl flex items-center justify-between border-b border-orange-500/30 backdrop-blur-xl pointer-events-auto">
           <div className="flex-1 flex justify-center items-center gap-3">
             <WifiOff className="w-4 h-4" />
             Offline Mode • Operating with Cached Map Data
           </div>
           <button 
            onClick={onDismissOffline}
            className="hover:bg-black/10 p-1.5 rounded-full transition-colors ml-4"
            title="Dismiss Offline Alert"
           >
             <X className="w-4 h-4" />
           </button>
         </div>
      )}
    </div>
  );
};