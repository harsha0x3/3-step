export interface NewVendor {
  vendor_name: string;
  vendor_owner: string;
  mobile_number?: string;
}

export interface VendorItem {
  id: string;
  vendor_name: string;
  vendor_owner: string;
  mobile_number?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorSpocItem {
  id: string;
  vendor_id: string;
  full_name: string;
  mobile_number?: string;
  photo: string;
  vendor: VendorItem;
}

export interface VendorsSearchParams {
  search_by?: string | null;
  search_term?: string | null;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface VendorSpocSearchParams {
  search_by?: string | null;
  search_term?: string | null;
  vendor_id?: string | null;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}
