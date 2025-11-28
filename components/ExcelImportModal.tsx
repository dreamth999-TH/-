
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  WasteRecord, AddressType, Community, HouseholdWasteType, 
  WastewaterMgmtType, ResponsiblePerson, Road 
} from '../types';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: Omit<WasteRecord, 'id' | 'timestamp'>[]) => Promise<void>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Omit<WasteRecord, 'id' | 'timestamp'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      ['ประเภทที่อยู่', 'ชื่อร้าน', 'ชื่อ-นามสกุล', 'ชุมชน', 'บ้านเลขที่', 'ถนน', 'เบอร์โทร', 'จำนวนผู้อยู่อาศัย', 'การจัดการขยะ', 'การจัดการน้ำเสีย', 'ผู้รับผิดชอบ']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "waste_data_template.xlsx");
  };

  const mapToEnum = <T extends Record<string, string>>(value: string, enumObj: T): T[keyof T] | undefined => {
    if (!value) return undefined;
    // Exact match value
    const exactMatch = Object.values(enumObj).find(v => v === value.trim());
    if (exactMatch) return exactMatch as T[keyof T];
    
    // Match key? (Optional, but user inputs usually match value in Thai)
    return undefined;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const parsedRecords: Omit<WasteRecord, 'id' | 'timestamp'>[] = [];
        
        data.forEach((row: any, index: number) => {
           // Mapping based on Thai Headers expected
           const fullName = row['ชื่อ-นามสกุล'] || row['Full Name'];
           const address = row['บ้านเลขที่'] || row['Address'];
           const phone = row['เบอร์โทร'] || row['Phone'];

           if (fullName && address) {
             const record: Omit<WasteRecord, 'id' | 'timestamp'> = {
                addressType: mapToEnum(row['ประเภทที่อยู่'], AddressType) || AddressType.HOUSE,
                shopName: row['ชื่อร้าน'] || row['Shop Name'] || undefined,
                fullName: String(fullName).trim(),
                community: mapToEnum(row['ชุมชน'], Community) || Community.PANGLOR,
                address: String(address),
                road: mapToEnum(row['ถนน'], Road) || '', // Allow empty if not matched
                phone: String(phone || '-'),
                residentsCount: Number(row['จำนวนผู้อยู่อาศัย']) || 1,
                householdWaste: mapToEnum(row['การจัดการขยะ'], HouseholdWasteType) || HouseholdWasteType.GREEN_BAG_NEW,
                wastewaterMgmt: mapToEnum(row['การจัดการน้ำเสีย'], WastewaterMgmtType) || WastewaterMgmtType.GREASE_TRAP,
                responsiblePerson: mapToEnum(row['ผู้รับผิดชอบ'], ResponsiblePerson) || ResponsiblePerson.NONE,
             };
             parsedRecords.push(record);
           }
        });

        if (parsedRecords.length === 0) {
            setError("ไม่พบข้อมูลที่ถูกต้องในไฟล์ หรือหัวตารางไม่ถูกต้อง");
        } else {
            setPreviewData(parsedRecords);
        }

      } catch (err) {
        console.error(err);
        setError("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    try {
        await onImport(previewData);
        Swal.fire('สำเร็จ', `นำเข้าข้อมูล ${previewData.length} รายการเรียบร้อยแล้ว`, 'success');
        onClose();
    } catch (err) {
        Swal.fire('ข้อผิดพลาด', 'เกิดปัญหาขณะนำเข้าข้อมูล', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
            <FileSpreadsheet size={24} /> นำเข้าข้อมูลจาก Excel
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
             <AlertCircle className="text-blue-500 shrink-0 mt-1" size={20} />
             <div className="text-sm text-blue-800">
                <p className="font-bold mb-1">คำแนะนำ:</p>
                <p>1. กรุณาใช้ไฟล์ Excel (.xlsx) ที่มีหัวตารางถูกต้อง</p>
                <p>2. คอลัมน์ที่จำเป็น: <b>ชื่อ-นามสกุล, บ้านเลขที่</b></p>
                <p>3. ข้อมูลอื่นๆ จะถูกตั้งเป็นค่าเริ่มต้นหากระบุไม่ถูกต้อง</p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="mt-3 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Download size={14}/> ดาวน์โหลดแบบฟอร์มตัวอย่าง
                </button>
             </div>
          </div>

          {/* Upload Area */}
          {!previewData.length && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative">
               <input 
                 type="file" 
                 accept=".xlsx, .xls" 
                 onChange={handleFileUpload} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <Upload size={48} className="mb-4 text-green-300" />
               <p className="font-medium text-lg">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
               <p className="text-sm text-gray-400 mt-2">รองรับไฟล์ .xlsx, .xls</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-gray-700">ตัวอย่างข้อมูล ({previewData.length} รายการ)</h3>
                   <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-red-500 text-sm hover:underline">ยกเลิก/เลือกไฟล์ใหม่</button>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 uppercase">
                         <tr>
                            <th className="px-4 py-2">ชื่อร้าน</th>
                            <th className="px-4 py-2">ชื่อ-นามสกุล</th>
                            <th className="px-4 py-2">ที่อยู่</th>
                            <th className="px-4 py-2">ประเภท</th>
                            <th className="px-4 py-2">ขยะ</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {previewData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="bg-white hover:bg-gray-50">
                               <td className="px-4 py-2 text-gray-500">{row.shopName || '-'}</td>
                               <td className="px-4 py-2 font-medium">{row.fullName}</td>
                               <td className="px-4 py-2">{row.address}</td>
                               <td className="px-4 py-2">{row.addressType}</td>
                               <td className="px-4 py-2">{row.householdWaste}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   {previewData.length > 5 && (
                      <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">
                        ...และอีก {previewData.length - 5} รายการ
                      </div>
                   )}
                </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">ปิด</button>
           {previewData.length > 0 && (
             <button 
               onClick={handleConfirmImport} 
               disabled={loading}
               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-bold flex items-center gap-2 disabled:opacity-50"
             >
               {loading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20} />}
               ยืนยันการนำเข้า
             </button>
           )}
        </div>

      </div>
    </div>
  );
};