
import React from 'react';
import { WasteRecord } from '../types';
import { Edit, Trash2, MapPin, Phone, User, Droplets, Trash, Users, ExternalLink, Store } from 'lucide-react';

interface RecordCardProps {
  record: WasteRecord;
  onEdit: (record: WasteRecord) => void;
  onDelete: (id: string) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-green-50 flex flex-col h-full">
      {/* Header / Image Area */}
      <div className="h-48 overflow-hidden relative bg-gray-100">
        {record.imageUrl ? (
          <img 
            src={record.imageUrl} 
            alt={record.fullName} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <span className="text-sm">ไม่มีรูปภาพ</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-green-800 shadow-sm">
          {record.addressType}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col gap-2">
        <div>
           {record.shopName && (
             <h4 className="font-bold text-green-700 text-base flex items-center gap-1 mb-0.5">
               <Store size={14} className="mt-0.5"/> {record.shopName}
             </h4>
           )}
           <h3 className={`font-bold text-gray-800 flex items-center gap-2 ${record.shopName ? 'text-sm' : 'text-lg'}`}>
             {record.fullName}
           </h3>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1 mt-1">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-1 flex-shrink-0 text-green-600" />
            <span>{record.address} {record.road} <br/><span className="text-green-700 font-medium">{record.community}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="flex-shrink-0 text-green-600" />
            <span>{record.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="flex-shrink-0 text-green-600" />
            <span>สมาชิก {record.residentsCount || '-'} คน</span>
          </div>
        </div>

        {/* Map Link */}
        {record.lat && record.lng && (
           <a 
             href={`https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`}
             target="_blank"
             rel="noreferrer"
             className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
           >
             <ExternalLink size={12}/> ดูแผนที่
           </a>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 p-2 rounded-lg">
            <p className="text-green-800 font-semibold mb-1 flex items-center gap-1"><Trash size={12}/> ขยะครัวเรือน</p>
            <p className="text-gray-700">{record.householdWaste}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg">
            <p className="text-blue-800 font-semibold mb-1 flex items-center gap-1"><Droplets size={12}/> น้ำเสีย</p>
            <p className="text-gray-700">{record.wastewaterMgmt}</p>
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><User size={12}/> {record.responsiblePerson}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between">
        <button 
          onClick={() => onEdit(record)}
          className="flex-1 mr-2 bg-white border border-yellow-400 text-yellow-600 hover:bg-yellow-50 py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm font-medium transition-colors"
        >
          <Edit size={16} /> แก้ไข
        </button>
        <button 
          onClick={() => onDelete(record.id)}
          className="flex-1 ml-2 bg-white border border-red-400 text-red-600 hover:bg-red-50 py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm font-medium transition-colors"
        >
          <Trash2 size={16} /> ลบ
        </button>
      </div>
    </div>
  );
};