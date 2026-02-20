export type SalesBodyType = {
  branchId: number;
  customerId: number;
  items: { productId: number; quantity: number }[];
};

type branch = {
  branchName: string;
  quantity: number;
};

export type salesType = {
  productName: string;
  branches: branch[];
};
