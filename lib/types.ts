// Type definitions for Supabase query results

export interface ResidentWithRoom {
  id: string;
  name: string;
  admission_date: string;
  room_id: string | null;
  rooms: {
    room_number: string;
  } | null;
}

export interface RentWithResident {
  id: string;
  due_date: string;
  amount: number;
  resident_id: string;
  residents: {
    id: string;
    name: string;
    rooms: {
      room_number: string;
    } | null;
  };
}

export interface ResidentQueryResult {
  id: string;
  name: string;
  admission_date: string;
  room_id: string | null;
  rooms: {
    room_number: string;
  } | null;
}

