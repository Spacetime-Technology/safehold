export interface AccessLogEntry {
  id: string;
  timestamp: string;
  tool_name: string;
  client_name: string;
  fields_requested: string[];
  purpose: string;
  document_id?: string;
}
