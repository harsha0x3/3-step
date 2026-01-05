export interface ApiResponse<T> {
  msg: string;
  data: T;
}

export interface RegionOut {
  name: string;
  id: string;
}
