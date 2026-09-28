export type ItemStatus = 'active' | 'in_deal' | 'swapped' | 'on_moderation' | 'rejected';
export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface User {
  id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  city: string;
  created_at: string;
}

export interface Item {
  id: number;
  user_id: number;
  title: string;
  description: string;
  condition: string;
  wishlist: string;
  images: string[];
  city: string;
  status: ItemStatus;
  created_at: string;
  owner?: User | null;
}

export interface SwapOffer {
  id: number;
  sender_id: number;
  recipient_id: number;
  offered_item_id: number;
  target_item_id: number;
  comment?: string | null;
  status: SwapStatus;
  created_at: string;
  offered_item?: Item | null;
  target_item?: Item | null;
  sender?: User | null;
  recipient?: User | null;
  contact_username?: string | null;
}
