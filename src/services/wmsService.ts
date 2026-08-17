import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Location, Movement, MovementType } from '../types';
import XLSX from 'xlsx-js-style';

const PRODUCTS_COLLECTION = 'products';
const LOCATIONS_COLLECTION = 'locations';
const MOVEMENTS_COLLECTION = 'movements';

// ----------------------------------------------------
// REAL-TIME SUBSCRIBERS WITH LOCAL STORAGE FALLBACK
// ----------------------------------------------------

export function subscribeProducts(onData: (products: Product[]) => void): () => void {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      // Local backup for offline resilience
      try {
        localStorage.setItem('wms_cache_products', JSON.stringify(list));
      } catch (e) {
        /* ignore storage quota */
      }
      onData(list);
    },
    (err) => {
      console.warn('Firestore Products subscription error, using offline cache:', err);
      const cached = localStorage.getItem('wms_cache_products');
      if (cached) {
        try {
          onData(JSON.parse(cached));
        } catch (e) {
          onData([]);
        }
      } else {
        onData([]);
      }
    }
  );
}

export function subscribeLocations(onData: (locations: Location[]) => void): () => void {
  const q = query(collection(db, LOCATIONS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Location[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Location);
      });
      list.sort((a, b) => a.code.localeCompare(b.code));
      try {
        localStorage.setItem('wms_cache_locations', JSON.stringify(list));
      } catch (e) {}
      onData(list);
    },
    (err) => {
      console.warn('Firestore Locations subscription error:', err);
      const cached = localStorage.getItem('wms_cache_locations');
      if (cached) {
        try {
          onData(JSON.parse(cached));
        } catch (e) {
          onData([]);
        }
      } else {
        onData([]);
      }
    }
  );
}

export function subscribeMovements(onData: (movements: Movement[]) => void): () => void {
  const q = query(collection(db, MOVEMENTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Movement[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Movement);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (err) => {
      console.warn('Firestore Movements subscription error:', err);
      onData([]);
    }
  );
}

// ----------------------------------------------------
// PRODUCT OPERATIONS
// ----------------------------------------------------

export async function addProductDoc(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = doc(collection(db, PRODUCTS_COLLECTION));
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, newProduct);

  if (data.currentStock > 0) {
    await addMovementDoc({
      productId: docRef.id,
      productName: data.name,
      productBarcode: data.barcode,
      type: 'IN',
      quantity: data.currentStock,
      previousStock: 0,
      newStock: data.currentStock,
      sourceLocation: 'PROVEEDOR / ALTA',
      targetLocation: data.locationCode || 'GÓNDOLA A-01',
      operator: 'Sistema / Alta Repuesto',
      notes: 'Alta inicial de repuesto de camión',
      createdAt: now,
    });
  }

  return docRef.id;
}

export async function importBulkProductsDoc(products: Product[]): Promise<number> {
  let count = 0;
  const CHUNK_SIZE = 400; // Safe size below Firestore 500 limit
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const prod of chunk) {
      const docRef = prod.id ? doc(db, PRODUCTS_COLLECTION, prod.id) : doc(collection(db, PRODUCTS_COLLECTION));
      batch.set(docRef, { ...prod, id: docRef.id });
      count++;
    }
    await batch.commit();
  }
  return count;
}

export async function updateProductDoc(id: string, updates: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProductDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}

// ----------------------------------------------------
// LOCATION OPERATIONS
// ----------------------------------------------------

export async function addLocationDoc(
  data: Omit<Location, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = doc(collection(db, LOCATIONS_COLLECTION));
  const now = new Date().toISOString();
  const location: Location = {
    ...data,
    id: docRef.id,
    createdAt: now,
  };
  await setDoc(docRef, location);
  return docRef.id;
}

export async function updateLocationDoc(id: string, updates: Partial<Location>): Promise<void> {
  const docRef = doc(db, LOCATIONS_COLLECTION, id);
  await updateDoc(docRef, updates);
}

export async function deleteLocationDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, LOCATIONS_COLLECTION, id));
}

// ----------------------------------------------------
// STOCK MOVEMENTS & KARDEX
// ----------------------------------------------------

export async function addMovementDoc(data: Omit<Movement, 'id'>): Promise<string> {
  const docRef = doc(collection(db, MOVEMENTS_COLLECTION));
  const movement: Movement = {
    ...data,
    id: docRef.id,
  };
  await setDoc(docRef, movement);
  return docRef.id;
}

export async function executeStockOperation(params: {
  product: Product;
  type: MovementType;
  quantity: number;
  newLocationCode?: string;
  operator: string;
  notes?: string;
}): Promise<void> {
  const { product, type, quantity, newLocationCode, operator, notes } = params;
  const now = new Date().toISOString();

  let previousStock = product.currentStock;
  let newStock = previousStock;
  let sourceLoc = product.locationCode;
  let targetLoc = product.locationCode;

  if (type === 'IN') {
    newStock = previousStock + quantity;
    if (newLocationCode) targetLoc = newLocationCode;
  } else if (type === 'OUT') {
    newStock = Math.max(0, previousStock - quantity);
  } else if (type === 'ADJUSTMENT') {
    newStock = quantity;
  } else if (type === 'RELOCATION') {
    if (newLocationCode) {
      targetLoc = newLocationCode;
    }
  } else if (type === 'STOCKTAKE') {
    newStock = quantity;
  }

  await updateProductDoc(product.id, {
    currentStock: newStock,
    locationCode: targetLoc,
    updatedAt: now,
  });

  await addMovementDoc({
    productId: product.id,
    productName: product.name,
    productBarcode: product.barcode,
    type,
    quantity,
    previousStock,
    newStock,
    sourceLocation: sourceLoc,
    targetLocation: targetLoc,
    operator: operator || 'Operador WMS Eurotruck',
    notes: notes || '',
    createdAt: now,
  });
}

// ----------------------------------------------------
// REAL-TIME AUDIT & MULTI-DEVICE INVENTORY COUNT
// ----------------------------------------------------

export async function recordProductAuditDoc(params: {
  productId: string;
  count: number;
  locationCode: string;
  operatorName?: string;
  previousStock?: number;
  productName?: string;
  barcode?: string;
  additionalUpdates?: Partial<Product>;
}): Promise<void> {
  const {
    productId,
    count,
    locationCode,
    operatorName = 'Operador Eurotruck',
    previousStock = 0,
    productName = '',
    barcode = '',
    additionalUpdates = {}
  } = params;

  const now = new Date().toISOString();
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);

  await updateDoc(docRef, {
    currentStock: Math.max(0, count),
    locationCode: locationCode || '1b1',
    estante: locationCode || '1b1',
    isAudited: true,
    auditedAt: now,
    auditedBy: operatorName,
    auditedCount: Math.max(0, count),
    auditedLocation: locationCode || '1b1',
    counterName: operatorName,
    updatedAt: now,
    ...additionalUpdates,
  });

  // Log in Kardex Movements for real-time audit history
  await addMovementDoc({
    productId,
    productName: productName || 'Repuesto de Camión',
    productBarcode: barcode || productId,
    type: 'STOCKTAKE',
    quantity: count,
    previousStock,
    newStock: count,
    sourceLocation: locationCode || '1b1',
    targetLocation: locationCode || '1b1',
    operator: operatorName,
    notes: `Conteo físico en góndola ${locationCode}. Stock verificado: ${count} unidades.`,
    createdAt: now,
  });
}

export async function resetAllProductAuditsDoc(products: Product[]): Promise<void> {
  const CHUNK_SIZE = 400;
  const now = new Date().toISOString();
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const prod of chunk) {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.update(docRef, {
        isAudited: false,
        updatedAt: now,
      });
    }
    await batch.commit();
  }
}

// ----------------------------------------------------
// EXCEL EXPORT MATCHING EUROTRUCK SRL IMAGE & GENERAL REPORT
// ----------------------------------------------------

/**
 * Generates the official EUROTRUCK SRL PHYSICAL COUNT Excel Report matching the image uploaded:
 * Banner 1: EUROTRUCK SRL
 * Banner 2: SISTEMA DE INVENTARIO
 * Banner 3: REPORTE DE PRODUCTOS PARA CONTEO FÍSICO DE FECHA DD/MM/YYYY
 * Column D Note: ESTA COLUMNA ES OBLIGATORIA
 * Columns G-K Note: ESTAS TRES COLUMNAS SON INFORMATIVAS, NO SE CARGAN
 * Header Row 4:
 * ALMACÉN | NO. PRODUCTO | DESCRIPCIÓN PRODUCTO | CONTADOR | CANTIDAD EMP. MAYOR | CANTIDAD UNIDADES | REFERENCIA | ESTANTE | TRAMO | COSTO | PRECIO
 */
export function exportEurotruckConteoExcel(products: Product[]): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const thinBorder = {
    top: { style: 'thin', color: { rgb: 'A0A0A0' } },
    bottom: { style: 'thin', color: { rgb: 'A0A0A0' } },
    left: { style: 'thin', color: { rgb: 'A0A0A0' } },
    right: { style: 'thin', color: { rgb: 'A0A0A0' } }
  };

  const ws: any = {};

  const setCell = (r: number, c: number, v: any, style: any, type: string = 's', numFmt?: string) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    ws[cellRef] = {
      v: v ?? '',
      t: type,
      s: style,
      ...(numFmt ? { z: numFmt } : {})
    };
  };

  // BANNER ROW 0 (A1:K1) - EUROTRUCK SRL
  for (let c = 0; c <= 10; c++) {
    setCell(0, c, c === 0 ? 'EUROTRUCK SRL' : '', {
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1B365D' } },
      alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      border: thinBorder
    });
  }

  // BANNER ROW 1 (A2:K2) - SISTEMA DE INVENTARIO
  for (let c = 0; c <= 10; c++) {
    setCell(1, c, c === 0 ? 'SISTEMA DE INVENTARIO' : '', {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1B365D' } },
      alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      border: thinBorder
    });
  }

  // SUB-BANNER ROW 2 (A3:K3)
  // Cols 0-2: REPORTE DE PRODUCTOS PARA CONTEO FÍSICO...
  for (let c = 0; c <= 2; c++) {
    setCell(2, c, c === 0 ? `REPORTE DE PRODUCTOS PARA CONTEO FÍSICO DE FECHA ${dateStr} ${timeStr}` : '', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2E75B6' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder
    });
  }
  // Cols 3-5: ESTA COLUMNA ES OBLIGATORIA
  for (let c = 3; c <= 5; c++) {
    setCell(2, c, c === 3 ? 'ESTA COLUMNA ES OBLIGATORIA' : '', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'C00000' } },
      fill: { fgColor: { rgb: 'D9E1F2' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    });
  }
  // Cols 6-10: ESTAS TRES COLUMNAS SON INFORMATIVAS, NO SE CARGAN
  for (let c = 6; c <= 10; c++) {
    setCell(2, c, c === 6 ? 'ESTAS TRES COLUMNAS SON INFORMATIVAS, NO SE CARGAN' : '', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'C00000' } },
      fill: { fgColor: { rgb: 'FFFF00' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    });
  }

  // HEADER ROW 3 (A4:K4)
  const headers = [
    { label: 'ALMACÉN', bg: '1F497D', text: 'FFFFFF' },
    { label: 'NO. PRODUCTO', bg: '1F497D', text: 'FFFFFF' },
    { label: 'DESCRIPCIÓN PRODUCTO', bg: '1F497D', text: 'FFFFFF' },
    { label: 'CONTADOR', bg: '2E75B6', text: 'FFFFFF' },
    { label: 'CANTIDAD EMP. MAYOR', bg: '2E75B6', text: 'FFFFFF' },
    { label: 'CANTIDAD UNIDADES', bg: '2E75B6', text: 'FFFFFF' },
    { label: 'REFERENCIA', bg: 'FFFF00', text: '000000' },
    { label: 'ESTANTE', bg: 'FFFF00', text: '000000' },
    { label: 'TRAMO', bg: 'FFFF00', text: '000000' },
    { label: 'COSTO', bg: 'FFFF00', text: '000000' },
    { label: 'PRECIO', bg: 'FFFF00', text: '000000' }
  ];

  headers.forEach((h, colIdx) => {
    setCell(3, colIdx, h.label, {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: h.text } },
      fill: { fgColor: { rgb: h.bg } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thinBorder
    });
  });

  // DATA ROWS (Row 4 onwards)
  let currentRow = 4;

  products.forEach((p) => {
    const locParts = (p.locationCode || '').split('-');
    const estanteVal = p.estante || (locParts.length >= 3 ? locParts[2] : p.locationCode || 'A-01');
    const tramoVal = p.tramo || (locParts.length >= 4 ? locParts[3] : '01');

    // Col A: ALMACÉN
    setCell(currentRow, 0, p.warehouseCode || '01', {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    });

    // Col B: NO. PRODUCTO
    setCell(currentRow, 1, p.barcode || p.sku, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder
    });

    // Col C: DESCRIPCIÓN PRODUCTO
    setCell(currentRow, 2, p.name, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder
    });

    // Col D: CONTADOR (Soft Blue Fill)
    setCell(currentRow, 3, p.counterName || '', {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'D9E1F2' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder
    });

    // Col E: CANTIDAD EMP. MAYOR
    setCell(currentRow, 4, p.majorBoxQty ?? '', {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    }, typeof p.majorBoxQty === 'number' ? 'n' : 's');

    // Col F: CANTIDAD UNIDADES
    setCell(currentRow, 5, p.currentStock, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    }, 'n');

    // Col G: REFERENCIA (Yellow Fill)
    setCell(currentRow, 6, p.referenceOEM || p.sku, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFF00' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder
    });

    // Col H: ESTANTE (Yellow Fill)
    setCell(currentRow, 7, estanteVal, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFF00' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    });

    // Col I: TRAMO (Yellow Fill)
    setCell(currentRow, 8, tramoVal, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFF00' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    });

    // Col J: COSTO (Yellow Fill)
    setCell(currentRow, 9, p.priceCost || 0, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFF00' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: thinBorder
    }, 'n', '$#,##0.00');

    // Col K: PRECIO (Yellow Fill)
    setCell(currentRow, 10, p.priceSale || 0, {
      font: { name: 'Calibri', sz: 10 },
      fill: { fgColor: { rgb: 'FFFF00' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: thinBorder
    }, 'n', '$#,##0.00');

    currentRow++;
  });

  // Extra Blank Rows (10 blank rows for manual counting if printed)
  for (let i = 0; i < 10; i++) {
    setCell(currentRow, 0, '01', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 1, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 2, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 3, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'D9E1F2' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 4, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 5, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 6, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 7, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 8, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 9, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: thinBorder });
    setCell(currentRow, 10, '', { font: { name: 'Calibri', sz: 10 }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: thinBorder });
    currentRow++;
  }

  // Range of worksheet
  ws['!ref'] = `A1:K${currentRow}`;

  // Column Widths
  ws['!cols'] = [
    { wch: 10 }, // ALMACÉN
    { wch: 20 }, // NO. PRODUCTO
    { wch: 45 }, // DESCRIPCIÓN PRODUCTO
    { wch: 18 }, // CONTADOR
    { wch: 22 }, // CANTIDAD EMP. MAYOR
    { wch: 20 }, // CANTIDAD UNIDADES
    { wch: 22 }, // REFERENCIA
    { wch: 15 }, // ESTANTE
    { wch: 15 }, // TRAMO
    { wch: 14 }, // COSTO
    { wch: 14 }  // PRECIO
  ];

  // Row Heights
  const rowHeights = [
    { hpt: 26 }, // Row 0: EUROTRUCK SRL
    { hpt: 22 }, // Row 1: SISTEMA DE INVENTARIO
    { hpt: 24 }, // Row 2: Sub-banner
    { hpt: 28 }, // Row 3: Headers
  ];
  for (let r = 4; r < currentRow; r++) {
    rowHeights.push({ hpt: 20 });
  }
  ws['!rows'] = rowHeights;

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Row 0 A1:K1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Row 1 A2:K2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },  // Row 2 A3:C3
    { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } },  // Row 2 D3:F3
    { s: { r: 2, c: 6 }, e: { r: 2, c: 10 } }  // Row 2 G3:K3
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conteo Físico');

  const dateFile = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `EUROTRUCK_Reporte_Inventario_${dateFile}.xlsx`);
}

export function exportCleanSimpleExcel(products: Product[]): void {
  exportEurotruckConteoExcel(products);
}

/**
 * Generates the full detailed inventory report with photos & links as requested in prompt section 3:
 * Código de Barra | Ubicación (Góndola) | Nombre del Artículo | Categoría / Compatibilidad | Cantidad (Stock) | Foto 1 (Link/Ref) | Foto 2 (Link/Ref) | Fecha de Registro
 */
export function exportGeneralInventoryToExcel(products: Product[], locations: Location[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Inventario Completo con Fotos & Links
  const productsData = products.map((p) => {
    const locParts = (p.locationCode || '').split('-');
    const estanteVal = p.estante || (locParts.length >= 3 ? locParts[2] : p.locationCode || 'A-01');
    const tramoVal = p.tramo || (locParts.length >= 4 ? locParts[3] : '01');

    return {
      'Código de Barra': p.barcode,
      'SKU / Clave': p.sku,
      'Ubicación (Góndola)': p.locationCode,
      'Estante': estanteVal,
      'Tramo': tramoVal,
      'Nombre del Artículo': p.name,
      'Categoría': p.category,
      'Compatibilidad Camión': p.brandCompatibility || 'Universal',
      'Referencia OEM': p.referenceOEM || 'N/A',
      'Cantidad (Stock)': p.currentStock,
      'Costo ($)': p.priceCost,
      'Precio ($)': p.priceSale,
      'Valor Total Costo ($)': p.currentStock * p.priceCost,
      'Foto 1 (Frontal / Link)': p.photoFront ? (p.photoFront.startsWith('data:') ? '[Imagen Adjunta / Base64]' : p.photoFront) : 'Sin Foto Frontal',
      'Foto 2 (Detalle / Link)': p.photoDetail ? (p.photoDetail.startsWith('data:') ? '[Imagen Adjunta / Base64]' : p.photoDetail) : 'Sin Foto Detalle',
      'Fecha de Registro': new Date(p.createdAt || Date.now()).toLocaleDateString('es-ES'),
      'Notas': p.notes || ''
    };
  });

  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  wsProducts['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 18 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Inventario Repuestos');

  // Sheet 2: Mapeo de Ubicaciones
  const locationsData = locations.map((loc) => {
    const prodsInLoc = products.filter((p) => p.locationCode === loc.code);
    const totalUnits = prodsInLoc.reduce((sum, item) => sum + item.currentStock, 0);
    return {
      'Código Ubicación': loc.code,
      'Pasillo': loc.aisle,
      'Góndola / Estante': loc.gondola,
      'Nivel / Tramo': loc.level,
      'Posición': loc.position,
      'Descripción': loc.description,
      'Capacidad Máx': loc.maxCapacity,
      'Repuestos Asignados': prodsInLoc.length,
      'Unidades Totales': totalUnits,
      'Estado': loc.status
    };
  });

  const wsLocations = XLSX.utils.json_to_sheet(locationsData);
  XLSX.utils.book_append_sheet(wb, wsLocations, 'Ubicaciones Almacén');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Inventario_General_Eurotruck_${dateStr}.xlsx`);
}

export function exportMovementsToExcel(movements: Movement[]): void {
  const movementsData = movements.map((m) => ({
    'ID Movimiento': m.id,
    'Fecha / Hora': new Date(m.createdAt).toLocaleString('es-ES'),
    'Tipo Movimiento': m.type,
    'Producto / Repuesto': m.productName,
    'Código Barras': m.productBarcode,
    'Cantidad': m.quantity,
    'Stock Anterior': m.previousStock,
    'Nuevo Stock': m.newStock,
    'Ubicación Origen': m.sourceLocation,
    'Ubicación Destino': m.targetLocation,
    'Operador': m.operator,
    'Notas': m.notes || ''
  }));

  const wb = XLSX.utils.book_new();
  const wsMovements = XLSX.utils.json_to_sheet(movementsData);
  XLSX.utils.book_append_sheet(wb, wsMovements, 'Kardex Eurotruck');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Kardex_Movimientos_Eurotruck_${dateStr}.xlsx`);
}

export async function importProductsFromExcel(
  file: File,
  currentProducts: Product[]
): Promise<{ added: number; updated: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let addedCount = 0;
        let updatedCount = 0;

        // Detect if Eurotruck layout (row 3 has headers or row 0)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const rowStr = JSON.stringify(rows[i] || []);
          if (rowStr.includes('NO. PRODUCTO') || rowStr.includes('Código de Barra') || rowStr.includes('DESCRIPCIÓN PRODUCTO')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers: string[] = (rows[headerRowIndex] || []).map((h: any) => String(h || '').trim());

        const getColVal = (rowArr: any[], possibleNames: string[]): string => {
          for (const name of possibleNames) {
            const idx = headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));
            if (idx !== -1 && rowArr[idx] !== undefined && rowArr[idx] !== null) {
              return String(rowArr[idx]).trim();
            }
          }
          return '';
        };

        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const barcode = getColVal(row, ['NO. PRODUCTO', 'Código de Barra', 'Barcode', 'no. producto']);
          const name = getColVal(row, ['DESCRIPCIÓN PRODUCTO', 'Nombre del Artículo', 'Nombre del Producto', 'Descripción']);

          if (!barcode || !name) continue;

          const sku = getColVal(row, ['SKU', 'sku']) || `SKU-${barcode.slice(-6)}`;
          const category = getColVal(row, ['Categoría', 'category']) || 'Repuestos General';
          const brandComp = getColVal(row, ['Compatibilidad', 'Compatibilidad Camión', 'Marca Compatibilidad']) || 'Volvo Trucks';
          const partBrand = getColVal(row, ['Marca de la Pieza', 'Marca Pieza', 'Fabricante', 'Part Brand', 'Marca']) || 'Eurotruck / Genuine OEM';
          const refOEM = getColVal(row, ['REFERENCIA', 'Referencia OEM', 'OEM']) || '';
          const currentStock = Number(getColVal(row, ['CANTIDAD UNIDADES', 'Cantidad (Stock)', 'Stock']) || 0);
          const estanteVal = getColVal(row, ['ESTANTE', 'Estante', 'Góndola']) || '1C1';
          const tramoVal = getColVal(row, ['TRAMO', 'Tramo', 'Nivel']) || '1C1';
          const locationCode = getColVal(row, ['Ubicación (Góndola)', 'Ubicacion']) || `Góndola ${estanteVal} - Tramo ${tramoVal}`;
          const priceCost = Number(getColVal(row, ['COSTO', 'Costo ($)']) || 0);
          const priceSale = Number(getColVal(row, ['PRECIO', 'Precio ($)']) || 0);
          const counterName = getColVal(row, ['CONTADOR', 'Contador']) || '';
          const majorBoxQty = Number(getColVal(row, ['CANTIDAD EMP. MAYOR']) || 0);

          const existing = currentProducts.find((p) => p.barcode === barcode || p.sku === sku);

          if (existing) {
            await updateProductDoc(existing.id, {
              name,
              sku,
              category,
              partBrand,
              brandCompatibility: brandComp,
              referenceOEM: refOEM,
              currentStock,
              estante: estanteVal,
              tramo: tramoVal,
              locationCode,
              priceCost,
              priceSale,
              counterName,
              majorBoxQty,
            });
            updatedCount++;
          } else {
            await addProductDoc({
              barcode,
              name,
              sku,
              category,
              partBrand,
              brandCompatibility: brandComp,
              referenceOEM: refOEM,
              unit: 'Unidad',
              currentStock,
              minStock: 5,
              estante: estanteVal,
              tramo: tramoVal,
              locationCode,
              priceCost,
              priceSale,
              counterName,
              majorBoxQty,
              warehouseCode: '01',
              notes: 'Importado desde Excel Eurotruck',
            });
            addedCount++;
          }
        }

        resolve({ added: addedCount, updated: updatedCount });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// ----------------------------------------------------
// INITIAL TRUCK PARTS DEMO DATA SEEDING (EUROTRUCK SRL)
// ----------------------------------------------------

export async function seedDemoWMSDataIfEmpty(): Promise<boolean> {
  const prodSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
  if (!prodSnap.empty) {
    return false;
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. Initial Locations (Eurotruck SRL Warehouse Aisles A, B, C & Gondolas)
  const sampleLocations: Location[] = [
    { id: 'loc_01', code: 'PAS-01-G01-N1-P01', aisle: 'PAS-01', gondola: 'G01 (Estante A1)', level: 'N1 (Tramo 1)', position: 'P01', description: 'Góndola A1 - Nivel Base Filtros y Lubricación', maxCapacity: 150, status: 'active', createdAt: now },
    { id: 'loc_02', code: 'PAS-01-G01-N2-P02', aisle: 'PAS-01', gondola: 'G01 (Estante A1)', level: 'N2 (Tramo 2)', position: 'P02', description: 'Góndola A1 - Nivel Medio Sensores y Electricidad', maxCapacity: 120, status: 'active', createdAt: now },
    { id: 'loc_03', code: 'PAS-01-G02-N1-P01', aisle: 'PAS-01', gondola: 'G02 (Estante A2)', level: 'N1 (Tramo 1)', position: 'P01', description: 'Góndola A2 - Nivel Base Pastillas y Discos Freno', maxCapacity: 80, status: 'active', createdAt: now },
    { id: 'loc_04', code: 'PAS-02-G01-N1-P01', aisle: 'PAS-02', gondola: 'G01 (Estante B1)', level: 'N1 (Tramo 1)', position: 'P01', description: 'Góndola B1 - Componentes de Motor Volvo / Scania', maxCapacity: 100, status: 'active', createdAt: now },
    { id: 'loc_05', code: 'PAS-02-G02-N2-P02', aisle: 'PAS-02', gondola: 'G02 (Estante B2)', level: 'N2 (Tramo 2)', position: 'P02', description: 'Góndola B2 - Inyectores & Turbo Compresores', maxCapacity: 60, status: 'active', createdAt: now },
    { id: 'loc_06', code: 'PAS-03-G01-N1-P01', aisle: 'PAS-03', gondola: 'G01 (Estante C1)', level: 'N1 (Tramo 1)', position: 'P01', description: 'Góndola C1 - Suspensión y Pulmones Neumáticos', maxCapacity: 50, status: 'active', createdAt: now },
  ];

  for (const l of sampleLocations) {
    batch.set(doc(db, LOCATIONS_COLLECTION, l.id), l);
  }

  // 2. Initial Sample Truck Spare Parts Products (Eurotruck SRL Catalogue)
  const sampleProducts: Product[] = [
    {
      id: 'prod_01',
      sku: 'FIL-VOL-001',
      barcode: 'ART-001001',
      name: 'Filtro de Aceite Volvo FH16 / FM Series',
      category: 'Filtros y Mantenimiento',
      brandCompatibility: 'Volvo Trucks',
      referenceOEM: 'VO-21707134',
      unit: 'Unidad',
      minStock: 10,
      currentStock: 35,
      majorBoxQty: 2,
      warehouseCode: '01',
      estante: 'A-01',
      tramo: '01',
      locationCode: 'PAS-01-G01-N1-P01',
      priceCost: 28.50,
      priceSale: 45.00,
      counterName: 'Juan Pérez',
      notes: 'Repuesto original Volvo Penta / Eurotruck',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod_02',
      sku: 'FRE-SCA-002',
      barcode: 'ART-001002',
      name: 'Juego Pastillas de Freno Delantero Scania R450 / Streamline',
      category: 'Sistema de Frenos',
      brandCompatibility: 'Scania',
      referenceOEM: 'SC-2092813',
      unit: 'Juego',
      minStock: 8,
      currentStock: 14,
      majorBoxQty: 1,
      warehouseCode: '01',
      estante: 'A-02',
      tramo: '01',
      locationCode: 'PAS-01-G02-N1-P01',
      priceCost: 65.00,
      priceSale: 98.00,
      counterName: 'Juan Pérez',
      notes: 'Incluye sensores de desgaste',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod_03',
      sku: 'SEN-MER-003',
      barcode: 'ART-001003',
      name: 'Sensor de Presión de Aceite Mercedes-Benz Actros MP4',
      category: 'Sistema Eléctrico & Sensores',
      brandCompatibility: 'Mercedes-Benz',
      referenceOEM: 'MB-A0071530828',
      unit: 'Unidad',
      minStock: 5,
      currentStock: 3, // LOW STOCK ALERT
      majorBoxQty: 0,
      warehouseCode: '01',
      estante: 'A-01',
      tramo: '02',
      locationCode: 'PAS-01-G01-N2-P02',
      priceCost: 42.00,
      priceSale: 72.00,
      counterName: 'Carlos Rivas',
      notes: '¡Alerta de reorden! Repuesto de alta rotación',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod_04',
      sku: 'INY-FRE-004',
      barcode: 'ART-001004',
      name: 'Inyector Diesel Bosch Common Rail Freightliner Cascadia DD15',
      category: 'Inyección & Motor',
      brandCompatibility: 'Freightliner',
      referenceOEM: 'FR-A4720700887',
      unit: 'Pieza',
      minStock: 6,
      currentStock: 18,
      majorBoxQty: 3,
      warehouseCode: '01',
      estante: 'B-02',
      tramo: '02',
      locationCode: 'PAS-02-G02-N2-P02',
      priceCost: 280.00,
      priceSale: 420.00,
      counterName: 'Juan Pérez',
      notes: 'Calibrado y sellado de fábrica',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod_05',
      sku: 'SUS-MAN-005',
      barcode: 'ART-001005',
      name: 'Pulmón de Suspensión Neumática Trasera MAN TGX / TGS',
      category: 'Suspensión & Chasis',
      brandCompatibility: 'MAN',
      referenceOEM: 'MAN-81436010151',
      unit: 'Unidad',
      minStock: 4,
      currentStock: 8,
      majorBoxQty: 1,
      warehouseCode: '01',
      estante: 'C-01',
      tramo: '01',
      locationCode: 'PAS-03-G01-N1-P01',
      priceCost: 85.00,
      priceSale: 135.00,
      counterName: 'Carlos Rivas',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod_06',
      sku: 'EMB-IVE-006',
      barcode: 'ART-001006',
      name: 'Kit de Embrague Completo Iveco Stralis / Trakker 430',
      category: 'Transmisión & Embrague',
      brandCompatibility: 'Iveco',
      referenceOEM: 'IV-500054812',
      unit: 'Juego',
      minStock: 3,
      currentStock: 0, // OUT OF STOCK
      majorBoxQty: 0,
      warehouseCode: '01',
      estante: 'B-01',
      tramo: '01',
      locationCode: 'PAS-02-G01-N1-P01',
      priceCost: 310.00,
      priceSale: 490.00,
      counterName: 'Juan Pérez',
      notes: 'Agotado - Pedido en camino desde aduana',
      createdAt: now,
      updatedAt: now,
    }
  ];

  for (const p of sampleProducts) {
    batch.set(doc(db, PRODUCTS_COLLECTION, p.id), p);
  }

  // 3. Initial Movements
  const sampleMovements: Movement[] = [
    {
      id: 'mov_01',
      productId: 'prod_01',
      productName: 'Filtro de Aceite Volvo FH16 / FM Series',
      productBarcode: 'ART-001001',
      type: 'IN',
      quantity: 35,
      previousStock: 0,
      newStock: 35,
      sourceLocation: 'Recepción Proveedor Volvo',
      targetLocation: 'PAS-01-G01-N1-P01',
      operator: 'Juan Pérez (Recepción)',
      notes: 'Recepción de pedido Eurotruck #1084',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mov_02',
      productId: 'prod_03',
      productName: 'Sensor de Presión de Aceite Mercedes-Benz Actros MP4',
      productBarcode: 'ART-001003',
      type: 'OUT',
      quantity: 4,
      previousStock: 7,
      newStock: 3,
      sourceLocation: 'PAS-01-G01-N2-P02',
      targetLocation: 'Taller Flota #2',
      operator: 'Carlos Rivas (Despacho)',
      notes: 'Despacho urgente para reparación de camión Actros',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    }
  ];

  for (const m of sampleMovements) {
    batch.set(doc(db, MOVEMENTS_COLLECTION, m.id), m);
  }

  await batch.commit();
  return true;
}

// ----------------------------------------------------
// FULL SYSTEM BACKUP (EXPORT & IMPORT JSON)
// ----------------------------------------------------

export interface FullSystemBackup {
  system: string;
  version: string;
  exportedAt: string;
  products: Product[];
  locations: Location[];
  movements: Movement[];
}

export function exportFullSystemBackupJSON(
  products: Product[],
  locations: Location[],
  movements: Movement[]
): void {
  const backup: FullSystemBackup = {
    system: 'EUROTRUCK SRL - WMS INVENTARIO COMPLETO',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    products,
    locations,
    movements
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `Respaldo_Completo_EUROTRUCK_WMS_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFullSystemBackupJSON(jsonData: any): Promise<{
  productsCount: number;
  locationsCount: number;
  movementsCount: number;
}> {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Formato de archivo inválido. Debe ser un archivo JSON de respaldo.');
  }

  const products: Product[] = Array.isArray(jsonData.products) ? jsonData.products : [];
  const locations: Location[] = Array.isArray(jsonData.locations) ? jsonData.locations : [];
  const movements: Movement[] = Array.isArray(jsonData.movements) ? jsonData.movements : [];

  if (products.length === 0 && locations.length === 0 && movements.length === 0) {
    throw new Error('El archivo JSON no contiene listas válidas de productos, góndolas o movimientos.');
  }

  let productsCount = 0;
  let locationsCount = 0;
  let movementsCount = 0;

  const CHUNK_SIZE = 400;

  // 1. Restore Products
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const prod of chunk) {
      if (!prod.name) continue;
      const docRef = prod.id ? doc(db, PRODUCTS_COLLECTION, prod.id) : doc(collection(db, PRODUCTS_COLLECTION));
      batch.set(docRef, { ...prod, id: docRef.id });
      productsCount++;
    }
    await batch.commit();
  }

  // 2. Restore Locations
  for (let i = 0; i < locations.length; i += CHUNK_SIZE) {
    const chunk = locations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const loc of chunk) {
      if (!loc.code) continue;
      const docRef = loc.id ? doc(db, LOCATIONS_COLLECTION, loc.id) : doc(collection(db, LOCATIONS_COLLECTION));
      batch.set(docRef, { ...loc, id: docRef.id });
      locationsCount++;
    }
    await batch.commit();
  }

  // 3. Restore Movements
  for (let i = 0; i < movements.length; i += CHUNK_SIZE) {
    const chunk = movements.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const mov of chunk) {
      if (!mov.productName) continue;
      const docRef = mov.id ? doc(db, MOVEMENTS_COLLECTION, mov.id) : doc(collection(db, MOVEMENTS_COLLECTION));
      batch.set(docRef, { ...mov, id: docRef.id });
      movementsCount++;
    }
    await batch.commit();
  }

  return { productsCount, locationsCount, movementsCount };
}

