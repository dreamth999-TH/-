
import { WasteRecord, AddressType, Community, HouseholdWasteType, WastewaterMgmtType, ResponsiblePerson, SHEET_ID, FOLDER_ID, Road } from '../types';

const LOCAL_STORAGE_KEY = 'waste_mgmt_local_v2'; // Stores only user-added records
const LOCAL_OVERRIDES_KEY = 'waste_mgmt_overrides_v2'; // Stores edits to sheet records
const LOCAL_DELETED_KEY = 'waste_mgmt_deleted_v2'; // Stores IDs of deleted sheet records
const SHEET_NAME = 'ข้อมูล';

// Initial Mock Data (Fallback)
const MOCK_DATA: WasteRecord[] = [
  {
    id: '1',
    addressType: AddressType.HOUSE,
    fullName: 'สมชาย รักดี',
    community: Community.PANGLOR,
    address: '123/45',
    road: Road.KHUN_LUM_PRAPHAT,
    phone: '081-234-5678',
    householdWaste: HouseholdWasteType.GREEN_BAG_NEW,
    wastewaterMgmt: WastewaterMgmtType.GREASE_TRAP,
    responsiblePerson: ResponsiblePerson.PIN,
    timestamp: new Date().toISOString(),
    imageUrl: 'https://picsum.photos/400/300?random=1',
    residentsCount: 4,
    lat: 19.3020,
    lng: 97.9654
  },
  {
    id: '2',
    addressType: AddressType.RESTAURANT,
    shopName: 'ร้านอาหารป้าศรี',
    fullName: 'สมศรี มีทรัพย์',
    community: Community.KADKAO,
    address: '44/1',
    road: Road.SINGHANAT_BAMRUNG,
    phone: '089-999-8888',
    householdWaste: HouseholdWasteType.WET_BIN_OLD,
    wastewaterMgmt: WastewaterMgmtType.PUBLIC_SEWER,
    responsiblePerson: ResponsiblePerson.TOM,
    timestamp: new Date().toISOString(),
    imageUrl: 'https://picsum.photos/400/300?random=2',
    residentsCount: 6,
    lat: 19.2980,
    lng: 97.9620
  }
];

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe Storage Handler for Local Changes
const LocalStorage = {
  isAvailable: false,
  
  init: () => {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      LocalStorage.isAvailable = true;
    } catch (e) {
      console.warn('LocalStorage not available.');
      LocalStorage.isAvailable = false;
    }
  },

  // --- Local Records (New Items) ---
  getLocalRecords: (): WasteRecord[] => {
    if (LocalStorage.isAvailable) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  addLocalRecord: (record: WasteRecord) => {
    if (LocalStorage.isAvailable) {
      try {
        const current = LocalStorage.getLocalRecords();
        const updated = [record, ...current];
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
  },

  addMultipleLocalRecords: (records: WasteRecord[]) => {
    if (LocalStorage.isAvailable) {
      try {
        const current = LocalStorage.getLocalRecords();
        const updated = [...records, ...current];
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error writing multiple to localStorage', e);
      }
    }
  },

  updateLocalRecord: (updatedRecord: WasteRecord) => {
    if (LocalStorage.isAvailable) {
      try {
        const current = LocalStorage.getLocalRecords();
        const index = current.findIndex(r => r.id === updatedRecord.id);
        if (index !== -1) {
          current[index] = updatedRecord;
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        }
      } catch (e) { console.error(e); }
    }
  },

  deleteLocalRecord: (id: string) => {
    if (LocalStorage.isAvailable) {
      try {
        const current = LocalStorage.getLocalRecords();
        const updated = current.filter(r => r.id !== id);
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) { console.error(e); }
    }
  },

  // --- Overrides (Edits to Sheet Items) ---
  getOverrides: (): Record<string, WasteRecord> => {
    if (LocalStorage.isAvailable) {
      try {
        const stored = window.localStorage.getItem(LOCAL_OVERRIDES_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch { return {}; }
    }
    return {};
  },

  saveOverride: (record: WasteRecord) => {
    if (LocalStorage.isAvailable) {
      try {
        const overrides = LocalStorage.getOverrides();
        overrides[record.id] = record;
        window.localStorage.setItem(LOCAL_OVERRIDES_KEY, JSON.stringify(overrides));
      } catch (e) { console.error(e); }
    }
  },

  // --- Deleted IDs (Deletions of Sheet Items) ---
  getDeletedIds: (): string[] => {
    if (LocalStorage.isAvailable) {
      try {
        const stored = window.localStorage.getItem(LOCAL_DELETED_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    }
    return [];
  },

  addDeletedId: (id: string) => {
    if (LocalStorage.isAvailable) {
      try {
        const deleted = LocalStorage.getDeletedIds();
        if (!deleted.includes(id)) {
          deleted.push(id);
          window.localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(deleted));
        }
      } catch (e) { console.error(e); }
    }
  }
};

LocalStorage.init();

// --- Google Sheets Logic ---
const fetchFromGoogleSheet = async (): Promise<WasteRecord[] | null> => {
  try {
    const cacheBuster = new Date().getTime();
    // GVIZ API
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}&_=${cacheBuster}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch sheet');
    
    const text = await response.text();
    const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
    if (jsonStart === -1) return null;
    
    const jsonStr = text.substring(jsonStart + 47, text.length - 2);
    const data = JSON.parse(jsonStr);
    const rows = data.table.rows;
    
    if (!rows || rows.length === 0) return [];

    // Map Rows to Data based on User Requirement Order
    return rows.map((row: any, index: number) => {
       const c = row.c;
       if (!c) return null;
       const v = (idx: number) => c[idx]?.v ? String(c[idx].v) : '';

       const fullName = v(2); 
       if (!fullName || fullName === 'null') return null;

       return {
         id: `sheet-${index}-${v(0)}`, // Unique ID based on index and timestamp
         timestamp: v(0) || new Date().toISOString(),
         addressType: (v(1) as AddressType) || AddressType.HOUSE,
         fullName: fullName,
         community: (v(3) as Community) || Community.PANGLOR,
         address: v(4) || '',
         road: v(5) || '',
         phone: v(6) || '',
         householdWaste: (v(7) as HouseholdWasteType) || HouseholdWasteType.GREEN_BAG_NEW,
         imageUrl: v(8) || undefined,
         wastewaterMgmt: (v(9) as WastewaterMgmtType) || WastewaterMgmtType.GREASE_TRAP,
         responsiblePerson: (v(10) as ResponsiblePerson) || ResponsiblePerson.PIN,
         residentsCount: Number(v(11)) || 1,
         lat: v(12) ? Number(v(12)) : undefined,
         lng: v(13) ? Number(v(13)) : undefined,
         shopName: v(14) || undefined,
       };
    }).filter((r: any) => r !== null) as WasteRecord[];

  } catch (error) {
    console.warn('Fetch error:', error);
    return null;
  }
};

export const DataService = {
  // Load data
  getAllRecords: async (): Promise<WasteRecord[]> => {
    // 1. Fetch remote data
    const sheetData = await fetchFromGoogleSheet();
    
    // 2. Fetch local data
    const localNewRecords = LocalStorage.getLocalRecords();
    const localOverrides = LocalStorage.getOverrides();
    const deletedIds = LocalStorage.getDeletedIds();

    let processedSheetData: WasteRecord[] = [];

    if (sheetData) {
      // Apply deletions and overrides to sheet data
      processedSheetData = sheetData
        .filter(record => !deletedIds.includes(record.id))
        .map(record => localOverrides[record.id] ? localOverrides[record.id] : record);
    }

    console.log(`Loaded: ${processedSheetData.length} from Sheet (processed), ${localNewRecords.length} New Local`);
    
    // Merge: Local new additions show up first, then processed sheet data
    const mergedData = [...localNewRecords, ...processedSheetData];

    // Fallback if empty
    if (mergedData.length === 0 && !sheetData) return MOCK_DATA;

    return mergedData;
  },

  // Add record
  addRecord: async (record: Omit<WasteRecord, 'id' | 'timestamp'>): Promise<WasteRecord> => {
    await delay(800);
    const newRecord: WasteRecord = {
      ...record,
      id: `local-${Date.now()}`,
      timestamp: new Date().toLocaleString('th-TH')
    };
    
    // Save to local storage so it persists on refresh
    LocalStorage.addLocalRecord(newRecord);
    return newRecord;
  },

  // Add Multiple records
  addMultipleRecords: async (records: Omit<WasteRecord, 'id' | 'timestamp'>[]): Promise<void> => {
    await delay(1000);
    const newRecords = records.map((record, index) => ({
      ...record,
      id: `local-${Date.now()}-${index}`,
      timestamp: new Date().toLocaleString('th-TH')
    }));

    LocalStorage.addMultipleLocalRecords(newRecords);
  },

  // Update record
  updateRecord: async (updatedRecord: WasteRecord): Promise<void> => {
    await delay(500);
    if (updatedRecord.id.startsWith('local-')) {
      // Update purely local record
      LocalStorage.updateLocalRecord(updatedRecord);
    } else {
      // Update sheet record -> Save as override
      console.log('Overriding sheet record locally:', updatedRecord.id);
      LocalStorage.saveOverride(updatedRecord);
    }
  },

  // Delete record
  deleteRecord: async (id: string): Promise<void> => {
    await delay(500);
    if (id.startsWith('local-')) {
      // Delete purely local record
      LocalStorage.deleteLocalRecord(id);
    } else {
       // Delete sheet record -> Mark as deleted locally
       console.log('Marking sheet record as deleted locally:', id);
       LocalStorage.addDeletedId(id);
    }
  },

  uploadImage: async (file: File): Promise<string> => {
    await delay(1500);
    console.log(`[Simulation] Uploading image to Drive Folder: ${FOLDER_ID}`);
    // Simulating a returned URL. In real usage with script, this would be the Drive file link.
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
    });
  },

  checkConnection: async (): Promise<boolean> => {
    try {
      await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&_=${Date.now()}`);
      return true;
    } catch {
      return false;
    }
  }
};