import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface PartnerWidgetProps {
  onChat: () => Promise<string>;
}

const PartnerWidget: React.FC<PartnerWidgetProps> = ({ onChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    setLoading(true);
    const msg = await onChat();
    setMessage(msg);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 bg-slate-800 border border-indigo-500/30 text-slate-200 p-4 rounded-2xl rounded-tr-none shadow-2xl max-w-xs animate-fade-in-up relative">
          {loading ? (
             <div className="flex space-x-1 justify-center py-2">
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
             </div>
          ) : (
            <p className="text-sm leading-relaxed">{message}</p>
          )}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-slate-800 transform rotate-45 border-r border-b border-indigo-500/30"></div>
        </div>
      )}
      
      <button
        onClick={handleClick}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default PartnerWidget;
