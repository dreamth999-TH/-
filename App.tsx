
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  WasteRecord, ConnectionStatus, SHEET_ID, ResponsiblePerson 
} from './types';
import { DataService } from './services/dataService';
import { RecordForm } from './components/RecordForm';
import { Dashboard } from './components/Dashboard';
import { RecordCard } from './components/RecordCard';
import { ExcelImportModal } from './components/ExcelImportModal';
import { 
  LayoutDashboard, List, Search, PlusCircle, RefreshCw, 
  Database, AlertCircle, XCircle, Menu, X, ChevronRight,
  PieChart, BarChart2, Users, ExternalLink, Filter, Copy, Home, FileSpreadsheet, FileDown
} from 'lucide-react';
import Swal from 'sweetalert2';
import clsx from 'clsx';

type PageView = 'dashboard' | 'list';

function App() {
  // State
  const [data, setData] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | undefined>(undefined);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResponsible, setFilterResponsible] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState(20);

  // Initial Load
  useEffect(() => {
    fetchData();
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setConnectionStatus('loading');
    try {
      const records = await DataService.getAllRecords();
      setData(records);
      setConnectionStatus('online');
    } catch (error) {
      console.error(error);
      setConnectionStatus('offline');
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const isConnected = await DataService.checkConnection();
      setConnectionStatus(isConnected ? 'online' : 'offline');
    } catch {
      setConnectionStatus('offline');
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('loading');
    await checkConnection();
    if(connectionStatus === 'online') {
        Swal.fire('การเชื่อมต่อสำเร็จ', `Connected to Sheet ID: ${SHEET_ID.substring(0,6)}...`, 'success');
    }
  };

  // CRUD Operations
  const handleSaveRecord = async (record: Omit<WasteRecord, 'id' | 'timestamp'> | WasteRecord) => {
    try {
      if ('id' in record) {
        // Edit
        await DataService.updateRecord(record as WasteRecord);
        Swal.fire({ title: 'สำเร็จ!', text: 'อัพเดทข้อมูลเรียบร้อยแล้ว', icon: 'success', timer: 1500 });
      } else {
        // Add
        await DataService.addRecord(record);
        Swal.fire({ title: 'สำเร็จ!', text: 'เพิ่มข้อมูลเรียบร้อยแล้ว', icon: 'success', timer: 1500 });
      }
      fetchData(); // Refresh data
    } catch (error) {
      Swal.fire('Error', 'Failed to save record', 'error');
    }
  };

  const handleBulkImport = async (records: Omit<WasteRecord, 'id' | 'timestamp'>[]) => {
    try {
      await DataService.addMultipleRecords(records);
      fetchData();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "ข้อมูลนี้จะถูกลบถาวร!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await DataService.deleteRecord(id);
        fetchData();
        Swal.fire('ลบสำเร็จ!', 'ข้อมูลถูกลบเรียบร้อยแล้ว', 'success');
      }
    });
  };

  const handleEdit = (record: WasteRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingRecord(undefined);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const localRecords = data.filter(r => r.id.startsWith('local-'));
    
    if (localRecords.length === 0) {
      Swal.fire('ไม่มีข้อมูลใหม่', 'ขณะนี้ไม่มีข้อมูลใหม่ที่บันทึกเพิ่มในเครื่อง', 'info');
      return;
    }

    const rows = localRecords.map(r => 
      `${r.timestamp}\t${r.addressType}\t${r.fullName}\t${r.community}\t${r.address}\t${r.road}\t${r.phone}\t${r.householdWaste}\t${r.imageUrl || ''}\t${r.wastewaterMgmt}\t${r.responsiblePerson}\t${r.residentsCount}\t${r.lat || ''}\t${r.lng || ''}\t${r.shopName || ''}`
    ).join('\n');

    navigator.clipboard.writeText(rows).then(() => {
      Swal.fire({
        title: 'คัดลอกข้อมูลแล้ว!',
        html: `<div class="text-left text-sm">
          <p>คัดลอกข้อมูลใหม่ <b>${localRecords.length} รายการ</b> เรียบร้อยแล้ว</p>
          <p class="mt-2">ท่านสามารถไปที่ Google Sheet แล้วกด <b>Ctrl+V</b> เพื่อวางข้อมูลต่อท้ายได้เลย</p>
          <div class="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto whitespace-pre text-gray-500">
            ${localRecords[0].fullName} ...
          </div>
        </div>`,
        icon: 'success',
        confirmButtonText: 'รับทราบ'
      });
      setIsSidebarOpen(false);
    }).catch(err => {
      console.error('Failed to copy', err);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถคัดลอกข้อมูลได้', 'error');
    });
  };

  const handleExportExcel = () => {
    try {
      if (data.length === 0) {
        Swal.fire('ไม่มีข้อมูล', 'ไม่มีข้อมูลสำหรับส่งออก', 'info');
        return;
      }

      // Map data to Thai headers
      const exportData = data.map(record => ({
        'เวลาบันทึก': record.timestamp,
        'ประเภทที่อยู่': record.addressType,
        'ชื่อร้าน': record.shopName || '',
        'ชื่อ-นามสกุล': record.fullName,
        'ชุมชน': record.community,
        'บ้านเลขที่': record.address,
        'ถนน': record.road,
        'เบอร์โทร': record.phone,
        'จำนวนผู้อยู่อาศัย': record.residentsCount,
        'การจัดการขยะ': record.householdWaste,
        'การจัดการน้ำเสีย': record.wastewaterMgmt,
        'ผู้รับผิดชอบ': record.responsiblePerson,
        'ละติจูด': record.lat || '',
        'ลองจิจูด': record.lng || '',
        'ลิงค์รูปภาพ': record.imageUrl || ''
      }));

      // Create Worksheet and Workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลการจัดการขยะ");

      // Save file
      XLSX.writeFile(wb, `รายงานข้อมูลขยะ_${new Date().toISOString().slice(0,10)}.xlsx`);
      setIsSidebarOpen(false);
      
    } catch (error) {
      console.error('Export Error', error);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกไฟล์ Excel ได้', 'error');
    }
  };

  // Navigation Logic
  const navigateTo = (page: PageView) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    // If we are not on dashboard, go there first
    if (currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
      // Wait for render then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsSidebarOpen(false);
  };

  // Filtering Logic (Real-time)
  const filteredData = useMemo(() => {
    let result = data;

    if (filterResponsible) {
      result = result.filter(item => item.responsiblePerson === filterResponsible);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.fullName.toLowerCase().includes(lowerQuery) ||
        item.community.toLowerCase().includes(lowerQuery) ||
        item.road.toLowerCase().includes(lowerQuery) ||
        item.address.includes(lowerQuery) ||
        (item.shopName && item.shopName.toLowerCase().includes(lowerQuery)) ||
        item.responsiblePerson.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [data, searchQuery, filterResponsible]);

  const displayedData = filteredData.slice(0, displayLimit);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F0FDF4]">
      
      {/* Sidebar Navigation */}
      <div className={`fixed inset-0 z-50 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <div className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-green-50">
              <div className="flex items-center gap-2 text-green-800 font-bold">
                 <List size={24} /> เมนูหลัก
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
               <button 
                  onClick={() => { openNewForm(); setIsSidebarOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-medium flex items-center justify-between group transition-colors mb-2 border border-green-100"
               >
                  <span className="flex items-center gap-3"><PlusCircle size={20}/> เพิ่มข้อมูล</span>
                  <ChevronRight size={16} className="text-green-400 group-hover:translate-x-1 transition-transform" />
               </button>

               <button 
                  onClick={() => { setIsImportModalOpen(true); setIsSidebarOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium flex items-center justify-between group transition-colors mb-4 border border-blue-100"
               >
                  <span className="flex items-center gap-3"><FileSpreadsheet size={20}/> นำเข้า Excel</span>
                  <ChevronRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
               </button>

               <div className="text-xs font-semibold text-gray-400 uppercase px-4 py-2 mt-2">การนำทาง</div>
               
               <button 
                  onClick={() => navigateTo('dashboard')} 
                  className={clsx("w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors", currentPage === 'dashboard' ? "bg-green-100 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-green-600")}
               >
                  <Home size={18}/> หน้าแรก (ภาพรวม)
               </button>

               <button 
                  onClick={() => navigateTo('list')} 
                  className={clsx("w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors", currentPage === 'list' ? "bg-green-100 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-green-600")}
               >
                  <Database size={18}/> รายชื่อข้อมูลการจัดการขยะ
               </button>

               <div className="text-xs font-semibold text-gray-400 uppercase px-4 py-2 mt-4">การจัดการข้อมูล</div>

               <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors">
                  <FileDown size={18}/> ส่งออกเป็น Excel (ทั้งหมด)
               </button>

               <button onClick={handleExport} className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                  <Copy size={18}/> คัดลอกข้อมูลใหม่ (ลง Sheet)
               </button>

               <div className="text-xs font-semibold text-gray-400 uppercase px-4 py-2 mt-4">รายงานสรุป (หน้าแรก)</div>
               
               <button onClick={() => scrollToSection('waste-summary')} className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-green-600 flex items-center gap-3 transition-colors">
                  <PieChart size={18}/> สรุปยอดรวมการจัดการขยะ
               </button>
               
               <button onClick={() => scrollToSection('wastewater-summary')} className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-green-600 flex items-center gap-3 transition-colors">
                  <BarChart2 size={18}/> สรุปยอดรวมการจัดการน้ำเสีย
               </button>

               <button onClick={() => scrollToSection('responsible-summary')} className="w-full text-left px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-green-600 flex items-center gap-3 transition-colors">
                  <Users size={18}/> สรุปข้อมูลผู้รับผิดชอบ
               </button>
            </nav>

            <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              ระบบข้อมูลการจัดการขยะ V.1
            </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-green-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 mr-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors md:hidden"
             >
               <Menu size={24} />
             </button>
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 mr-2 hover:bg-green-50 rounded-lg text-green-700 transition-colors hidden md:block"
               title="เปิดเมนู"
             >
               <Menu size={24} />
             </button>

             <div 
               className="flex items-center gap-3 cursor-pointer" 
               onClick={() => navigateTo('dashboard')}
             >
               <div className="p-2 bg-gradient-to-tr from-green-500 to-teal-400 rounded-lg text-white shadow-lg hidden sm:block">
                 <Database size={24} />
               </div>
               <div>
                 <h1 className="text-xl font-bold text-gray-800 leading-tight">ระบบข้อมูลการจัดการขยะ</h1>
                 <p className="text-xs text-green-600 font-medium hidden sm:block">ในเขตเทศบาลเมืองแม่ฮ่องสอน</p>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-3 text-sm w-full md:w-auto justify-end">
             <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-colors", 
                connectionStatus === 'online' ? "bg-green-50 border-green-200 text-green-700" :
                connectionStatus === 'loading' ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                "bg-red-50 border-red-200 text-red-700"
             )}>
                <div className={clsx("w-2.5 h-2.5 rounded-full animate-pulse", 
                   connectionStatus === 'online' ? "bg-green-500" :
                   connectionStatus === 'loading' ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="font-semibold uppercase tracking-wider text-xs hidden sm:inline">
                  ID: {SHEET_ID.substring(0, 4)}...
                </span>
             </div>

             <button 
               onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${SHEET_ID}`, '_blank')} 
               className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
               title="เปิด Google Sheet"
             >
               <ExternalLink size={14} /> <span className="hidden sm:inline">Google Sheet</span>
             </button>

             <button onClick={handleTestConnection} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap">
               <RefreshCw size={14} className={connectionStatus === 'loading' ? 'animate-spin' : ''} /> <span className="hidden sm:inline">ทดสอบ</span>
             </button>
             
             <button onClick={fetchData} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md flex items-center gap-1.5 transition-colors whitespace-nowrap">
               <List size={14} /> <span className="hidden sm:inline">โหลดข้อมูล</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        
        {/* VIEW: DASHBOARD */}
        {currentPage === 'dashboard' && (
           <section className="animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                   <Home className="text-green-600"/> ภาพรวมระบบ
                </h2>
                <button 
                   onClick={() => navigateTo('list')}
                   className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm hover:underline"
                >
                   ไปที่รายชื่อข้อมูล <ChevronRight size={16} />
                </button>
              </div>
              <Dashboard data={data} />
           </section>
        )}

        {/* VIEW: LIST */}
        {currentPage === 'list' && (
          <section className="animate-fade-in-up space-y-6">
            
            {/* Action Bar (Only visible in List View) */}
            <div className="sticky top-20 z-20 bg-[#F0FDF4]/95 py-4 backdrop-blur-sm flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-green-200 pb-4">
              <div className="flex flex-col md:flex-row items-center gap-2 w-full lg:w-auto flex-grow">
                 
                 {/* Search */}
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="ค้นหา ชื่อ, ชุมชน, ถนน..." 
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                        <XCircle size={16} />
                      </button>
                    )}
                 </div>

                 {/* Filter by Responsible Person */}
                 <div className="relative w-full md:w-64">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <Filter size={18} />
                    </div>
                    <select
                      value={filterResponsible}
                      onChange={(e) => setFilterResponsible(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none shadow-sm appearance-none bg-white cursor-pointer text-gray-700"
                    >
                      <option value="">ผู้รับผิดชอบทั้งหมด</option>
                      {Object.values(ResponsiblePerson).map(person => (
                        <option key={person} value={person}>{person}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                       <ChevronRight size={14} className="rotate-90" />
                    </div>
                 </div>

              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full lg:w-auto px-4 py-2.5 bg-white border border-green-200 text-green-700 rounded-xl shadow-sm hover:bg-green-50 transition-all font-semibold flex items-center justify-center gap-2 shrink-0"
                  title="Import Excel"
                >
                  <FileSpreadsheet size={20} /> <span className="hidden xl:inline">นำเข้า Excel</span>
                </button>
                <button 
                  onClick={openNewForm}
                  className="w-full lg:w-auto px-6 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-green-200/50 hover:-translate-y-0.5 transition-all font-semibold flex items-center justify-center gap-2 shrink-0"
                >
                  <PlusCircle size={20} /> เพิ่มข้อมูล
                </button>
              </div>
            </div>

            {/* Data Grid */}
            <div id="data-list" className="space-y-4">
               <div className="flex justify-between items-end">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="text-green-600"/> รายชื่อข้อมูลการจัดการขยะ
                  </h2>
                  <p className="text-sm text-gray-500">
                    แสดง {displayedData.length} จาก {filteredData.length} รายการ
                  </p>
               </div>

               {loading ? (
                 <div className="flex justify-center items-center py-20">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                 </div>
               ) : filteredData.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-gray-500">ไม่พบข้อมูลที่ค้นหา</p>
                    <button onClick={() => { setSearchQuery(''); setFilterResponsible(''); }} className="mt-2 text-green-600 hover:underline">ล้างการค้นหา</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {displayedData.map(record => (
                     <RecordCard 
                       key={record.id} 
                       record={record} 
                       onEdit={handleEdit} 
                       onDelete={handleDelete} 
                     />
                   ))}
                 </div>
               )}

               {/* Load More */}
               {filteredData.length > displayedData.length && (
                 <div className="flex justify-center pt-4">
                   <button 
                     onClick={() => setDisplayLimit(prev => Math.min(prev + 20, 100))}
                     className="px-6 py-2 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 font-medium shadow-sm transition-colors"
                   >
                     แสดงเพิ่มเติม
                   </button>
                 </div>
               )}
            </div>
          </section>
        )}

      </main>

      <footer className="bg-green-900 text-green-100 py-6 text-center text-sm mt-auto">
        <div className="container mx-auto px-4">
          <p>© 2025 ระบบบันทึกข้อมูลการจัดการขยะ/น้ำเสีย | ผู้พัฒนา กองสาธารณสุขและสิ่งแวดล้อมเทศบาลเมืองแม่ฮ่องสอน - V.1</p>
        </div>
      </footer>

      {/* Modals */}
      <RecordForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleSaveRecord}
        initialData={editingRecord}
        existingRecords={data}
      />

      <ExcelImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
      />

    </div>
  );
}

export default App;
