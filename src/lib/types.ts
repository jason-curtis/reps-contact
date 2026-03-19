export interface Representative {
  bioguide_id: string;
  type: "sen" | "rep";
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district: number | null;
  phone: string | null;
  url: string | null;
  contact_form: string | null;
  photo_url: string | null;
  office: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ZipDistrict {
  zip: string;
  state: string;
  district: number;
  ratio: number;
}

export interface LookupResult {
  zip: string;
  representatives: Representative[];
  ambiguous: boolean;
  districts: { state: string; district: number }[];
}
