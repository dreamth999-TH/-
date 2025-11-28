import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`relative p-6 rounded-[2rem] shadow-lg text-white ${colorClass} overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group h-full border border-white/10`}>
      {/* Decorative Background Elements */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-black/5 rounded-full blur-xl pointer-events-none"></div>
      
      <div className="flex flex-col h-full relative z-10 justify-between">
        <div className="flex justify-between items-start mb-2">
           <div className="p-3.5 bg-white/25 backdrop-blur-md rounded-2xl shadow-inner text-white">
              {icon}
           </div>
        </div>
        
        <div className="mt-4">
           <h3 className="text-5xl font-black tracking-tight drop-shadow-sm leading-none mb-2">
             {value.toLocaleString()}
           </h3>
           <p className="text-base font-medium opacity-90 pl-1">
             {title}
           </p>
        </div>
      </div>
    </div>
  );
};
