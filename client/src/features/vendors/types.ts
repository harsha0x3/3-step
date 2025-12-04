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
