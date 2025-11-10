export interface NewVendor {
  vendor_name: string;
  location: string;
  contact: string;
}

export interface VendorItem {
  id: string;
  vendor_name: string;
  location: string;
  contact: string;
  created_at: string;
  updated_at: string;
}

export interface VendorSpocItem {
  id: string;
  vendor_id: string;
  full_name: string;
  contact: string;
  photo: string;
  vendor: VendorItem;
}
