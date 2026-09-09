export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Document {
  id: string;
  owner_id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}