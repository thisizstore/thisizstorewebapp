export interface Game {
  id: string;
  name: string;
  icon_name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  phone_number: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface JasaPosting {
  id: string;
  code: string;
  owner_name: string;
  game_id: string;
  price: number;
  phone_number: string;
  is_safe: boolean;
  additional_spec: string | null;
  photos: string[];
  user_id: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  game?: Game;
}

export interface JasaCari {
  id: string;
  code: string;
  requester_name: string;
  game_id: string;
  price_min: number;
  price_max: number;
  phone_number: string;
  account_spec: string;
  user_id: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  game?: Game;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}
