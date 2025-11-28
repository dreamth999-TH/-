import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { WasteRecord, HouseholdWasteType, WastewaterMgmtType, ResponsiblePerson } from '../types';
import { StatsCard } from './StatsCard';
import { Leaf, Droplets, Trash2, Sprout, Home, Users, UserCheck } from 'lucide-react';

interface DashboardProps {
  data: WasteRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  
  // Calculate Waste Stats
  const greenBagTotal = data.filter(r => 
    r.householdWaste === HouseholdWasteType.GREEN_BAG_NEW || 
    r.householdWaste === HouseholdWasteType.GREEN_BAG_OLD
  ).length;

  const wetBinTotal = data.filter(r => 
    r.householdWaste === HouseholdWasteType.WET_BIN_NEW || 
    r.householdWaste === HouseholdWasteType.WET_BIN_OLD
  ).length;

  const animalFeedTotal = data.filter(r => r.householdWaste === HouseholdWasteType.ANIMAL_FEED).length;
  const fertilizerTotal = data.filter(r => r.householdWaste === HouseholdWasteType.FERTILIZER).length;

  // Calculate Wastewater Stats
  const greaseTrapTotal = data.filter(r => r.wastewaterMgmt === WastewaterMgmtType.GREASE_TRAP).length;
  const septicTankTotal = data.filter(r => r.wastewaterMgmt === WastewaterMgmtType.SEPTIC_TANK).length;
  const privateAreaTotal = data.filter(r => r.wastewaterMgmt === WastewaterMgmtType.PRIVATE_AREA).length;
  const installingTrapTotal = data.filter(r => r.wastewaterMgmt === WastewaterMgmtType.INSTALLING_TRAP).length;
  const publicSewerTotal = data.filter(r => r.wastewaterMgmt === WastewaterMgmtType.PUBLIC_SEWER).length;

  // Calculate Responsible Person Stats
  const pinTotal = data.filter(r => r.responsiblePerson === ResponsiblePerson.PIN).length;
  const tomTotal = data.filter(r => r.responsiblePerson === ResponsiblePerson.TOM).length;
  const somsakTotal = data.filter(r => r.responsiblePerson === ResponsiblePerson.SOMSAK).length;
  const noneTotal = data.filter(r => r.responsiblePerson === ResponsiblePerson.NONE).length;

  // Chart Data Preparation
  const wasteChartData = [
    { name: 'ถุงเขียว', value: greenBagTotal, color: '#4ADE80' },
    { name: 'ถังขยะเปียก', value: wetBinTotal, color: '#2DD4BF' },
    { name: 'อาหารสัตว์', value: animalFeedTotal, color: '#FACC15' },
    { name: 'ทำปุ๋ย', value: fertilizerTotal, color: '#A3E635' },
  ];

  const wasteWaterChartData = [
    { name: 'ถังดักไขมัน', value: greaseTrapTotal, color: '#60A5FA' },
    { name: 'บ่อเกรอะ', value: septicTankTotal, color: '#818CF8' },
    { name: 'พื้นที่ส่วนตัว', value: privateAreaTotal, color: '#C084FC' },
    { name: 'กำลังติดตั้ง', value: installingTrapTotal, color: '#F472B6' },
    { name: 'ท่อสาธารณะ', value: publicSewerTotal, color: '#FB7185' },
  ];

  return (
    <div className="space-y-12">
      
      {/* Waste Section */}
      <div id="waste-summary" className="scroll-mt-28">
        <h3 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-600">
             <Trash2 size={28} />
          </div>
          สรุปยอดรวมการจัดการขยะ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="ถุงเขียว (ทั้งหมด)" 
            value={greenBagTotal} 
            icon={<Leaf size={32} strokeWidth={2.5}/>} 
            colorClass="bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-green-200" 
          />
          <StatsCard 
            title="ถังขยะเปียก (ทั้งหมด)" 
            value={wetBinTotal} 
            icon={<Trash2 size={32} strokeWidth={2.5}/>} 
            colorClass="bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 shadow-teal-200" 
          />
          <StatsCard 
            title="นำไปทำอาหารสัตว์" 
            value={animalFeedTotal} 
            icon={<Home size={32} strokeWidth={2.5}/>} 
            colorClass="bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 shadow-orange-200" 
          />
          <StatsCard 
            title="นำไปทำปุ๋ย" 
            value={fertilizerTotal} 
            icon={<Sprout size={32} strokeWidth={2.5}/>} 
            colorClass="bg-gradient-to-br from-lime-400 via-lime-500 to-lime-600 shadow-lime-200" 
          />
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-green-100/50">
           <h4 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
             <span className="w-1 h-6 bg-green-500 rounded-full"></span>
             กราฟแสดงข้อมูลการจัดการขยะ
           </h4>
           <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={wasteChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{fontFamily: 'Sarabun', fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontFamily: 'Sarabun', fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#F9FAFB'}}
                    contentStyle={{ fontFamily: 'Sarabun', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={50}>
                    {wasteChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Wastewater Section */}
      <div id="wastewater-summary" className="scroll-mt-28">
        <h3 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
             <Droplets size={28} />
          </div>
          สรุปยอดรวมการจัดการน้ำเสีย
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard title="ถังดักไขมัน" value={greaseTrapTotal} icon={<Droplets size={24}/>} colorClass="bg-gradient-to-br from-blue-400 to-blue-600" />
          <StatsCard title="บ่อเกรอะ" value={septicTankTotal} icon={<Droplets size={24}/>} colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600" />
          <StatsCard title="พื้นที่ส่วนตัว" value={privateAreaTotal} icon={<Home size={24}/>} colorClass="bg-gradient-to-br from-purple-400 to-purple-600" />
          <StatsCard title="กำลังติดตั้ง" value={installingTrapTotal} icon={<Sprout size={24}/>} colorClass="bg-gradient-to-br from-pink-400 to-pink-600" />
          <StatsCard title="ท่อสาธารณะ" value={publicSewerTotal} icon={<Trash2 size={24}/>} colorClass="bg-gradient-to-br from-rose-400 to-rose-600" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-100/50">
           <h4 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
             <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
             กราฟแสดงข้อมูลการจัดการน้ำเสีย
           </h4>
           <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={wasteWaterChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{fontFamily: 'Sarabun', fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontFamily: 'Sarabun', fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#F9FAFB'}}
                    contentStyle={{ fontFamily: 'Sarabun', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={50}>
                    {wasteWaterChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Responsible Person Section */}
      <div id="responsible-summary" className="scroll-mt-28">
        <h3 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
             <Users size={28} />
          </div>
          สรุปข้อมูลผู้รับผิดชอบ
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title={ResponsiblePerson.PIN} value={pinTotal} icon={<UserCheck size={32}/>} colorClass="bg-gradient-to-br from-violet-400 via-violet-500 to-purple-600" />
          <StatsCard title={ResponsiblePerson.TOM} value={tomTotal} icon={<UserCheck size={32}/>} colorClass="bg-gradient-to-br from-fuchsia-400 via-fuchsia-500 to-pink-600" />
          <StatsCard title={ResponsiblePerson.SOMSAK} value={somsakTotal} icon={<UserCheck size={32}/>} colorClass="bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600" />
          <StatsCard title={ResponsiblePerson.NONE} value={noneTotal} icon={<Users size={32}/>} colorClass="bg-gradient-to-br from-gray-400 via-gray-500 to-slate-600" />
        </div>
      </div>
    </div>
  );
};
