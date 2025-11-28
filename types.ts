
export interface WasteRecord {
  id: string;
  addressType: AddressType;
  fullName: string;
  residentsCount: number;
  community: Community;
  address: string;
  road: string;
  phone: string;
  householdWaste: HouseholdWasteType;
  imageUrl?: string;
  wastewaterMgmt: WastewaterMgmtType;
  responsiblePerson: ResponsiblePerson;
  timestamp: string;
  lat?: number;
  lng?: number;
  shopName?: string;
}

export enum AddressType {
  HOUSE = "บ้านเรือน",
  RESTAURANT = "ร้านอาหาร",
  SHOP = "ร้านค้า",
  ACCOMMODATION = "ที่พัก",
  OFFICE = "สำนักงาน"
}

export enum Community {
  PANGLOR = "ชุมชนปางล้อ",
  DONJEDI = "ชุมชนดอนเจดีย์",
  KADKAO = "ชุมชนกาดเก่า",
  EAST = "ชุมชนตะวันออก",
  NONGJONGKHAM = "ชุมชนหนองจองคำ",
  KLANGWIANG = "ชุมชนกลางเวียง"
}

export enum Road {
  KHUN_LUM_PRAPHAT = "ขุนลุมประพาส",
  SINGHANAT_BAMRUNG = "สิงหนาทบำรุง",
  PHADUNG_MUAI_TO = "ผดุงม่วยต่อ",
  PANG_LOR_NIKHOM = "ปางล้อนิคม",
  UDOM_CHAO_NITHET = "อุดมชาวนิเทศ",
  NIWET_PHISAN = "นิเวศพิศาล",
  CHAMNAN_SATHIT = "ชำนาญสถิต",
  PRADIT_JONG_KHAM = "ประดิษฐ์จองคำ",
  RATCHATHAM_PHITHAK = "ราชธรรมพิทักษ์",
  MAK_SANTI = "มรรคสันติ",
  SIRI_MONGKHON = "ศิริมงคล",
  PRACHACHON_UTHIT = "ประชาชนอุทิศ",
  PHANIT_WATTANA = "พาณิชย์วัฒนา",
  PRACHA_SEKSAN = "ประชาเสกสรร",
  SAMPHAN_CHAROEN_MUEANG = "สัมพันธ์เจริญเมือง",
  RUNGRUEANG_KAN_KHA = "รุ่งเรืองการค้า",
  NAWA_KHOTCHASAN = "นาวาคชสาร",
  BORIBAN_MUEANG_SUK = "บริบาลเมืองสุข"
}

export enum HouseholdWasteType {
  GREEN_BAG_NEW = "ถุงเขียว(รายใหม่)",
  GREEN_BAG_OLD = "ถุงเขียว(รายเก่า)",
  WET_BIN_NEW = "ถังขยะเปียก(รายใหม่)",
  WET_BIN_OLD = "ถังขยะเปียก(รายเก่า)",
  ANIMAL_FEED = "นำไปเป็นอาหารของสัตว์",
  FERTILIZER = "นำไปทำปุ๋ย"
}

export enum WastewaterMgmtType {
  GREASE_TRAP = "มีการติดตั้งถังดักไขมัน", // Changed wording slightly to match common usage, mapped to user request "ถังกัดไขมัน" logic
  SEPTIC_TANK = "ลงบ่อเกรอะ",
  PRIVATE_AREA = "ลงพื้นที่ส่วนบุคคล",
  INSTALLING_TRAP = "กำลังติดตั้งถังดักไขมัน",
  PUBLIC_SEWER = "ปล่อยน้ำเสียลงท่อน้ำสาธารณะ"
}

export enum ResponsiblePerson {
  PIN = "พี่ปิน",
  TOM = "พี่ทอม",
  SOMSAK = "พี่สมศักดิ์",
  NONE = "ไม่มีผู้รับผิดชอบ"
}

export type ConnectionStatus = 'online' | 'offline' | 'loading';

export const SHEET_ID = "192FUClWxT65rRtEiJfKxPHtqemH5nK66-i165vrKldI";
export const FOLDER_ID = "1ylvbyAV2ead_qhFWF54TYcnELIfdzXfl";