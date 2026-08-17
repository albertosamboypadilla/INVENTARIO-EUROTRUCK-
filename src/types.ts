export type ProductUnit = 'Unidad' | 'Pieza' | 'Juego' | 'Paquete' | 'Metros' | 'Litro' | 'Kg';

export interface Product {
  id: string;
  sku: string;
  barcode: string; // Código de Barra (EAN, QR o Interno ART-001001)
  name: string; // Descripción / Nombre del Repuesto
  partBrand?: string; // Marca de la Pieza / Fabricante (ej. Bosch, Donaldson, Fleetguard, OEM)
  category: string; // Categoría (e.g., Motor, Frenos, Suspensión, Eléctrico, Filtros)
  brandCompatibility?: string; // Compatibilidad Marca de Camión (Volvo, Scania, Mercedes, Freightliner, MAN, Iveco, Mack, Universal)
  referenceOEM?: string; // Número de Referencia OEM
  unit: ProductUnit;
  minStock: number;
  currentStock: number; // Cantidad Unidades
  majorBoxQty?: number; // Cantidad Empaque Mayor
  warehouseCode?: string; // Almacén (ej. '01')
  estante?: string; // Estante / Góndola (ej. 'A-01', 'EST-03')
  tramo?: string; // Tramo / Nivel (ej. 'T-02', 'N3')
  locationCode: string; // E.g., PAS-01-G02-N3-P01
  counterName?: string; // Contador / Audit
  priceCost: number; // Costo
  priceSale: number; // Precio
  photoFront?: string; // Foto 1 - Vista Frontal (base64 o URL)
  photoDetail?: string; // Foto 2 - Vista Detalle (base64 o URL)
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LocationStatus = 'active' | 'full' | 'maintenance';

export interface Location {
  id: string;
  code: string; // Primary key e.g. PAS-01-G02-N3-P01
  aisle: string; // e.g. PAS-01
  gondola: string; // e.g. G02 (Estante)
  level: string; // e.g. N3 (Tramo)
  position: string; // e.g. P01
  description: string;
  maxCapacity: number;
  currentCount?: number;
  status: LocationStatus;
  createdAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RELOCATION' | 'STOCKTAKE';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  productBarcode: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  sourceLocation: string;
  targetLocation: string;
  operator: string;
  notes?: string;
  createdAt: string;
}

export type ThermalSize = 'larguita' | 'pequena' | 'estandar' | 'grande' | '58mm' | '80mm' | '4x2in';

export interface LabelPrintConfig {
  product: Product;
  copies: number;
  size: ThermalSize;
  showPrice: boolean;
  showLocation: boolean;
  showBarcodeText: boolean;
}

export interface WMSStats {
  totalProducts: number;
  totalUnitsInStock: number;
  totalLocations: number;
  lowStockAlerts: number;
  outOfStock: number;
  totalInventoryValueCost: number;
  totalInventoryValueSale: number;
  todayMovements: number;
}
