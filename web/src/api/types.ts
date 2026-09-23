export type Entity = {
  id: string;
  version: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};
export type Product = Entity & {
  name: string;
  description?: string;
  baseUnit?: string;
  variants?: Variant[];
};
export type Variant = Entity & {
  productId: string;
  sku: string;
  displayName: string;
  trackingMode?: string;
  expirationRequired?: boolean;
  barcodes?: Barcode[];
};
export type Barcode = { id: string; value: string; type?: string };
export type Warehouse = Entity & {
  code: string;
  name: string;
  timezone?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  stateRegion?: string;
  countryCode?: string;
};
export type Zone = Entity & {
  warehouseId: string;
  code: string;
  name: string;
  type: string;
  sequence: number;
};
export type Location = Entity & {
  warehouseId: string;
  zoneId: string;
  parentId?: string;
  code: string;
  name: string;
  type: string;
  scanCode?: string;
  sequence: number;
};
export type Balance = {
  id: string;
  warehouseId: string;
  locationId: string;
  variantId: string;
  lotId?: string;
  serialId?: string;
  onHand: string;
  reserved: string;
  available: string;
};
export type Ledger = {
  id: string;
  occurredAt: string;
  variantId: string;
  locationId: string;
  quantityDelta: string;
  movementType: string;
  referenceId?: string;
};
export type Supplier = Entity & {
  supplierNumber: string;
  name: string;
  defaultCurrency: string;
  email?: string;
  phone?: string;
};
export type SupplierProduct = {
  id: string;
  version: number;
  supplierId: string;
  variantId: string;
  supplierSku: string;
  unitCost: string;
  currency: string;
  active: boolean;
};
export type PurchaseLine = {
  id: string;
  supplierProductId: string;
  variantId: string;
  variantSku: string;
  supplierSku: string;
  orderedQuantity: string;
  receivedBaseQuantity: string;
  baseQuantity: string;
  unitCost: string;
  lineSubtotal: string;
  expectedDeliveryDate?: string;
  version: number;
};
export type PurchaseOrder = Entity & {
  number: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  subtotal?: string;
  total?: string;
  currency?: string;
  expectedDeliveryDate?: string;
  supplierReference?: string;
  internalNote?: string;
  supplierNote?: string;
  lines: PurchaseLine[];
};
export type ReceiptLine = {
  id: string;
  purchaseOrderLineId: string;
  receivedBaseQuantity: string;
  receivingLocationId: string;
  lotId?: string;
  serialId?: string;
  variantId?: string;
};
export type Receipt = Entity & {
  receiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  lines: ReceiptLine[];
};
export type PutAway = Entity & {
  receiptLineId: string;
  destinationLocationId?: string;
  sourceLocationId?: string;
  variantId?: string;
  quantity: string;
  lotId?: string;
  serialId?: string;
};
export type Customer = Entity & {
  name: string;
  defaultCurrency: string;
  email?: string;
  shippingAddress?: string;
  billingAddress?: string;
};
export type SalesLine = {
  id: string;
  variantId: string;
  sku: string;
  orderedQuantity: string;
  allocatedQuantity: string;
  backorderedQuantity?: string;
  pickedQuantity: string;
  packedQuantity: string;
  shippedQuantity: string;
  unitPrice: string;
  subtotal?: string;
};
export type SalesOrder = Entity & {
  orderNumber: string;
  customerId: string;
  customerName?: string;
  warehouseId: string;
  warehouseName?: string;
  shippingAddress?: string;
  fulfillmentStatus?: string;
  shippingStatus?: string;
  subtotal?: string;
  currency?: string;
  lines: SalesLine[];
};
export type PickTask = Entity & {
  pickListId: string;
  variantId: string;
  sourceLocationId: string;
  lotId?: string;
  serialId?: string;
  requiredQuantity: string;
  pickedQuantity: string;
  sequence?: number;
};
export type PickList = Entity & {
  salesOrderId: string;
  salesOrderNumber: string;
  warehouseId: string;
  packingLocationId: string;
  tasks: PickTask[];
};
export type PackageItem = { id: string; pickTaskId: string; quantity: string };
export type Package = Entity & {
  sessionId: string;
  packageNumber: string;
  items: PackageItem[];
};
export type PackingSession = Entity & {
  pickListId: string;
  salesOrderId?: string;
  packages: Package[];
};
export type Shipment = Entity & {
  shipmentNumber: string;
  salesOrderId: string;
  warehouseId: string;
  packageIds: string[];
  carrierName?: string;
  serviceName?: string;
  trackingNumber?: string;
  dispatchedAt?: string;
};
export type Me = {
  tenantId: string;
  userId: string;
  subject: string;
  permissions: string[];
};
