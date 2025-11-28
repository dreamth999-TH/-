
import React, { useState, useEffect, useRef } from 'react';
import { 
  WasteRecord, AddressType, Community, HouseholdWasteType, 
  WastewaterMgmtType, ResponsiblePerson, FOLDER_ID, Road
} from '../types';
import { X, Save, Upload, Loader2, User, MapPin, Crosshair, Store } from 'lucide-react';
import Swal from 'sweetalert2';
import { DataService } from '../services/dataService';

// Declare L for Leaflet
declare const L: any;

interface RecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<WasteRecord, 'id' | 'timestamp'> | WasteRecord) => Promise<void>;
  initialData?: WasteRecord;
  existingRecords: WasteRecord[];
}

export const RecordForm: React.FC<RecordFormProps> = ({ isOpen, onClose, onSubmit, initialData, existingRecords }) => {
  const [formData, setFormData] = useState<Partial<WasteRecord>>({});
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setPreviewUrl(initialData.imageUrl || null);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  // Map Initialization Effect
  useEffect(() => {
    if (isOpen) {
      // Delay map initialization slightly to allow DOM to render
      const timer = setTimeout(() => {
        if (mapRef.current && typeof L !== 'undefined') {
          if (!leafletMap.current) {
            // Initialize map (Default to Mae Hong Son)
            const defaultLat = initialData?.lat || 19.3020;
            const defaultLng = initialData?.lng || 97.9654;
            
            leafletMap.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(leafletMap.current);

            // Add Click Handler
            leafletMap.current.on('click', (e: any) => {
               updateMarker(e.latlng.lat, e.latlng.lng);
            });

            // If initial data exists, add marker
            if (initialData?.lat && initialData?.lng) {
               updateMarker(initialData.lat, initialData.lng);
            }
          } else {
            // Map already exists, invalidate size to fix rendering issues in modals
            leafletMap.current.invalidateSize();
            if (initialData?.lat && initialData?.lng) {
              updateMarker(initialData.lat, initialData.lng);
              leafletMap.current.setView([initialData.lat, initialData.lng], 16);
            }
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData]);

  const updateMarker = (lat: number, lng: number) => {
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
    } else {
      marker.current = L.marker([lat, lng]).addTo(leafletMap.current);
    }
    setFormData(prev => ({ ...prev, lat, lng }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (leafletMap.current) {
             leafletMap.current.setView([latitude, longitude], 16);
             updateMarker(latitude, longitude);
          }
        },
        (error) => {
          Swal.fire('ข้อผิดพลาด', 'ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS', 'error');
        }
      );
    } else {
      Swal.fire('ข้อผิดพลาด', 'เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      shopName: '',
      addressType: AddressType.HOUSE,
      community: Community.PANGLOR,
      householdWaste: HouseholdWasteType.GREEN_BAG_NEW,
      wastewaterMgmt: WastewaterMgmtType.GREASE_TRAP,
      responsiblePerson: ResponsiblePerson.PIN,
      residentsCount: 1,
      address: '',
      phone: '',
      road: ''
    });
    setFile(null);
    setPreviewUrl(null);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'residentsCount' ? Number(value) : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.fullName || !formData.address || !formData.phone) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน โดยเฉพาะชื่อ-นามสกุล บ้านเลขที่ และเบอร์โทรศัพท์');
      }

      // Check Duplicates (only on create)
      if (!initialData) {
        const isDuplicate = existingRecords.some(r => r.fullName === formData.fullName);
        if (isDuplicate) {
          throw new Error(`ชื่อ ${formData.fullName} มีอยู่ในระบบแล้ว`);
        }
      }

      let finalImageUrl = formData.imageUrl;
      
      // Handle Image Upload
      if (file) {
        // In real world: upload to Google Drive using FOLDER_ID via script
        console.log(`Uploading to Folder ID: ${FOLDER_ID}`);
        finalImageUrl = await DataService.uploadImage(file);
      }

      const recordToSave = {
        ...formData,
        imageUrl: finalImageUrl,
        residentsCount: formData.residentsCount || 1
      } as WasteRecord;

      await onSubmit(recordToSave);
      onClose();
      if (!initialData) resetForm();

    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message,
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl animate-fade-in my-8 flex flex-col">
        
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-green-800">
              {initialData ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลการจัดการขยะ/น้ำเสีย'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
              <X size={28} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Section 1: Name and Basic Info */}
            <div className="space-y-4">
              
              {/* Full Name Row - Prominent */}
              <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm">
                <label className="block text-base font-bold text-green-900 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-green-600" />
                  </div>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName || ''} 
                    onChange={handleInputChange} 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-green-200 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all bg-white text-lg" 
                    placeholder="ระบุชื่อ-นามสกุล (เช่น นายสมชาย รักดี)" 
                    required 
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-1">กรุณาระบุคำนำหน้าชื่อด้วย (นาย/นาง/นางสาว)</p>
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                     <Store size={14} className="text-gray-500"/> ชื่อร้าน/สถานประกอบการ (หากมี)
                  </label>
                  <input 
                    type="text" 
                    name="shopName" 
                    value={formData.shopName || ''} 
                    onChange={handleInputChange} 
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none" 
                    placeholder="เช่น ร้านก๋วยเตี๋ยวป้าพร"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทที่อยู่</label>
                  <select name="addressType" value={formData.addressType} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none">
                    {Object.values(AddressType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชุมชน</label>
                  <select name="community" value={formData.community} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none">
                    {Object.values(Community).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none" placeholder="08x-xxx-xxxx" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้อยู่อาศัย (คน)</label>
                  <input type="number" name="residentsCount" value={formData.residentsCount || ''} onChange={handleInputChange} min="1" className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none" placeholder="ระบุจำนวน" />
                </div>
              </div>

               {/* Address Specifics Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">บ้านเลขที่ <span className="text-red-500">*</span></label>
                      <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none" required />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ถนน</label>
                      <select name="road" value={formData.road || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none">
                         <option value="">-- เลือกถนน --</option>
                         {Object.values(Road).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                   </div>
               </div>
            </div>

            <hr className="border-gray-100" />

            {/* Section 2: Waste Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">การจัดการขยะในครัวเรือน</label>
                <select name="householdWaste" value={formData.householdWaste} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none">
                  {Object.values(HouseholdWasteType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">การจัดการน้ำเสีย</label>
                <select name="wastewaterMgmt" value={formData.wastewaterMgmt} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none">
                  {Object.values(WastewaterMgmtType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับผิดชอบ</label>
                <select name="responsiblePerson" value={formData.responsiblePerson} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 outline-none">
                  {Object.values(ResponsiblePerson).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Section 3: Map */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="block text-sm font-bold text-gray-700"><MapPin size={16} className="inline mr-1"/>ระบุตำแหน่งแผนที่ (Google Map)</label>
                   <button 
                     type="button" 
                     onClick={handleGetCurrentLocation}
                     className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-100 border border-blue-200"
                   >
                     <Crosshair size={14}/> ใช้ตำแหน่งปัจจุบัน
                   </button>
                </div>
                <div className="w-full h-64 bg-gray-100 rounded-xl border border-gray-300 overflow-hidden relative">
                   <div ref={mapRef} className="w-full h-full z-10" />
                   {(!formData.lat || !formData.lng) && (
                     <div className="absolute inset-0 bg-black/10 z-20 pointer-events-none flex items-center justify-center">
                       <span className="bg-white/80 px-3 py-1 rounded text-xs">คลิกบนแผนที่เพื่อปักหมุด</span>
                     </div>
                   )}
                </div>
                {formData.lat && formData.lng && (
                  <p className="text-xs text-gray-500">
                    พิกัดที่เลือก: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </p>
                )}
            </div>

            {/* Section 4: Image Upload */}
            <div className="border-2 border-dashed border-green-200 rounded-xl p-4 flex flex-col items-center justify-center bg-green-50/50 hover:bg-green-50 transition-colors">
              {previewUrl ? (
                <div className="relative w-full h-48 mb-2">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                  <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Upload className="mx-auto text-green-400 mb-2" size={32} />
                  <p className="text-sm text-gray-500">อัพโหลดรูปภาพหน้าบ้าน (PNG)</p>
                </div>
              )}
              <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 cursor-pointer" />
              <p className="text-xs text-gray-400 mt-2">บันทึกลง FOLDER_ID: {FOLDER_ID}</p>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                ยกเลิก
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};