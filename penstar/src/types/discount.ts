export interface DiscountCode {
  id: number;
  code: string;
  type: string;
  value: number;
  min_total: number;
  max_uses: number;
  max_uses_per_user: number;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
}
