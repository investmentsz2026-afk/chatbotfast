// ===== TypeScript Types for Chatbot =====

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  type?: 'welcome' | 'location_select' | 'quick_action' | 'station_result' | 'general';
  step?: FlowStep;
  options?: QuickOption[];
  stations?: PoliceStationData[];
}

export type FlowStep = 
  | 'initial'
  | 'select_role'
  | 'select_department'
  | 'select_province'
  | 'select_district'
  | 'show_stations'
  | 'general_chat';

export interface QuickOption {
  id: string;
  label: string;
  icon?: string;
  value: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export interface LocationData {
  departments: DepartmentData[];
}

export interface DepartmentData {
  id: string;
  name: string;
}

export interface ProvinceData {
  id: string;
  name: string;
  departmentId: string;
}

export interface DistrictData {
  id: string;
  name: string;
  provinceId: string;
}

export interface PoliceStationData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  districtName?: string;
}

export interface KnowledgeDocumentData {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  createdAt: string;
  chunksCount?: number;
}

export interface ConversationState {
  step: FlowStep;
  role?: 'victim' | 'witness';
  departmentId?: string;
  departmentName?: string;
  provinceId?: string;
  provinceName?: string;
  districtId?: string;
  districtName?: string;
}
