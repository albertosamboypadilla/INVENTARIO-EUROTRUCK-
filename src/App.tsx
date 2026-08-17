import React, { useEffect, useState } from 'react';
import { Product, Location, Movement, MovementType } from './types';
import {
  subscribeProducts,
  subscribeLocations,
  subscribeMovements,
  addProductDoc,
  updateProductDoc,
  deleteProductDoc,
  addLocationDoc,
  executeStockOperation,
  exportEurotruckConteoExcel,
  exportGeneralInventoryToExcel,
  exportCleanSimpleExcel,
  exportFullSystemBackupJSON,
  seedDemoWMSDataIfEmpty
} from './services/wmsService';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { GondolasView } from './components/GondolasView';
import { CameraScannerView } from './components/CameraScannerView';
import { ThermalPrinterView } from './components/ThermalPrinterView';
import { MovementsView } from './components/MovementsView';
import { InventoryAuditView } from './components/InventoryAuditView';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ProductModal } from './components/ProductModal';
import { SecurityPinModal } from './components/SecurityPinModal';
import { PhotoDetailModal } from './components/PhotoDetailModal';

import { CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';

type ActiveTab = 'dashboard' | 'products' | 'inventory' | 'gondolas' | 'scanner' | 'thermal' | 'movements';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Firestore real-time state
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [selectedProductForThermal, setSelectedProductForThermal] = useState<Product | null>(null);
  const [photoModalProduct, setPhotoModalProduct] = useState<Product | null>(null);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Security PIN state (Key: 1989)
  const [pinModalState, setPinModalState] = useState<{
    isOpen: boolean;
    actionTitle: string;
    itemTitle: string;
    onAuthorized: () => void;
  }>({
    isOpen: false,
    actionTitle: '',
    itemTitle: '',
    onAuthorized: () => {},
  });

  // Notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleRequestPin = (action: 'edit' | 'delete', product: Product, onAuthorized: () => void) => {
    setPinModalState({
      isOpen: true,
      actionTitle: action === 'edit' ? 'Clave 1989 para EDITAR Repuesto' : 'Clave 1989 para ELIMINAR Repuesto',
      itemTitle: product.name,
      onAuthorized: () => {
        setPinModalState((prev) => ({ ...prev, isOpen: false }));
        onAuthorized();
      },
    });
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    handleRequestPin('edit', product, () => {
      setEditingProduct(product);
      setIsProductModalOpen(true);
    });
  };

  const handleOpenDeleteProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    handleRequestPin('delete', product, () => {
      if (confirm(`¿Está seguro de eliminar "${product.name}" del catálogo?`)) {
        handleDeleteProduct(id);
      }
    });
  };

  // Real-time subscriptions & initial seed
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubLocations: (() => void) | undefined;
    let unsubMovements: (() => void) | undefined;

    async function initFirestore() {
      try {
        await seedDemoWMSDataIfEmpty();
      } catch (e) {
        console.warn('Seed demo data skipped or failed:', e);
      }

      unsubProducts = subscribeProducts((updatedProducts) => {
        setProducts(updatedProducts);
        setIsLoading(false);
      });

      unsubLocations = subscribeLocations((updatedLocations) => {
        setLocations(updatedLocations);
      });

      unsubMovements = subscribeMovements((updatedMovements) => {
        setMovements(updatedMovements);
      });
    }

    initFirestore();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubLocations) unsubLocations();
      if (unsubMovements) unsubMovements();
    };
  }, []);

  // Handlers for Product operations
  const handleAddProduct = async (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = await addProductDoc(data);
    showNotification(`Artículo "${data.name}" guardado en el inventario.`, 'success');
    return id;
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    await updateProductDoc(id, updates);
    showNotification('Artículo actualizado correctamente.', 'success');
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProductDoc(id);
    showNotification('Artículo eliminado del inventario.', 'info');
  };

  // Handlers for Location operations
  const handleAddLocation = async (
    data: Omit<Location, 'id' | 'createdAt'>
  ): Promise<string> => {
    const id = await addLocationDoc(data);
    showNotification(`Góndola / Estante "${data.code}" registrada.`, 'success');
    return id;
  };

  // Stock Movement execution
  const handleExecuteMovement = async (params: {
    product: Product;
    type: MovementType;
    quantity: number;
    newLocationCode?: string;
    operator: string;
    notes?: string;
  }) => {
    await executeStockOperation(params);
    showNotification(
      `Movimiento (${params.type}) registrado para "${params.product.name}".`,
      'success'
    );
  };

  const handleOpenPrintLabel = (product: Product) => {
    setSelectedProductForThermal(product);
    setActiveTab('thermal');
  };

  const handleManualSeedDemo = async () => {
    try {
      await seedDemoWMSDataIfEmpty();
      showNotification('Catálogo demo cargado.', 'success');
    } catch (e: any) {
      showNotification('Error al cargar datos demo.', 'error');
    }
  };

  // Low Stock & Out of Stock Alerts count
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  const handleViewPhoto = (product: Product) => {
    setPhotoModalProduct(product);
  };

  const handleQuickStockChange = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.currentStock + delta);
    try {
      await updateProductDoc(product.id, { currentStock: newStock });
      showNotification(`Stock de "${product.name}" actualizado a ${newStock} u.`, 'info');
    } catch (err) {
      showNotification('Error al actualizar el stock.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold animate-slide-up ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950 border-rose-700 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportEurotruckExcel={() => exportCleanSimpleExcel(products)}
        onExportGeneralExcel={() => exportGeneralInventoryToExcel(products, locations)}
        onExportFullBackup={() => {
          exportFullSystemBackupJSON(products, locations, movements);
          showNotification('📦 Respaldo JSON completo descargado con éxito.', 'success');
        }}
        onOpenImportExcel={() => setIsImportExcelOpen(true)}
        onSeedDemo={handleManualSeedDemo}
        totalProductsCount={products.length}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-bold text-slate-300">
              Cargando inventario en tiempo real...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                products={products}
                locations={locations}
                movements={movements}
                onNavigateTab={setActiveTab}
                onOpenAddModal={handleOpenAddProduct}
                onExportCleanExcel={() => exportCleanSimpleExcel(products)}
                onOpenPrintLabel={handleOpenPrintLabel}
                onEditProduct={handleOpenEditProduct}
                onDeleteProduct={handleOpenDeleteProduct}
                onViewPhoto={handleViewPhoto}
                onQuickStockChange={handleQuickStockChange}
              />
            )}

            {activeTab === 'products' && (
              <ProductsView
                products={products}
                locations={locations}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onExecuteMovement={handleExecuteMovement}
                onOpenPrintLabel={handleOpenPrintLabel}
                onOpenScanner={() => setActiveTab('scanner')}
                onRequestPin={handleRequestPin}
                onBackToDashboard={() => setActiveTab('dashboard')}
                onViewPhoto={handleViewPhoto}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryAuditView
                products={products}
                locations={locations}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onOpenPrintLabel={handleOpenPrintLabel}
                onOpenScanner={() => setActiveTab('scanner')}
                onBackToDashboard={() => setActiveTab('dashboard')}
                onViewPhoto={handleViewPhoto}
              />
            )}

            {activeTab === 'gondolas' && (
              <GondolasView
                locations={locations}
                products={products}
                onAddLocation={handleAddLocation}
                onOpenPrintLabel={handleOpenPrintLabel}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'scanner' && (
              <CameraScannerView
                products={products}
                locations={locations}
                onExecuteMovement={handleExecuteMovement}
                onOpenPrintLabel={handleOpenPrintLabel}
                onRequestPin={handleRequestPin}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'thermal' && (
              <ThermalPrinterView
                products={products}
                initialSelectedProduct={selectedProductForThermal}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsView
                movements={movements}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-500 print:hidden">
        <p>EUROTRUCK SRL • Sistema de Inventario Ultra Sencillo PWA</p>
      </footer>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        onSave={async (data) => {
          if (editingProduct) {
            await handleUpdateProduct(editingProduct.id, data);
            showNotification(`✅ Repuesto "${data.name}" actualizado correctamente`);
          } else {
            await handleAddProduct(data);
            showNotification(`✅ Repuesto "${data.name}" creado correctamente`);
          }
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        locations={locations}
        onAddLocation={handleAddLocation}
        existingProductCount={products.length}
        onOpenScanner={() => {
          setIsProductModalOpen(false);
          setActiveTab('scanner');
        }}
      />

      {/* Security PIN Authorization Modal (Clave: 1989) */}
      <SecurityPinModal
        isOpen={pinModalState.isOpen}
        onClose={() => setPinModalState((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={pinModalState.onAuthorized}
        actionTitle={pinModalState.actionTitle}
        itemTitle={pinModalState.itemTitle}
      />

      {/* Data Management & Import Modal */}
      <ExcelImportModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        products={products}
        locations={locations}
        movements={movements}
      />

      {/* Photo Gallery & Detail Lightbox Modal */}
      <PhotoDetailModal
        product={photoModalProduct}
        isOpen={!!photoModalProduct}
        onClose={() => setPhotoModalProduct(null)}
        onOpenPrintLabel={handleOpenPrintLabel}
        onEditProduct={handleOpenEditProduct}
      />
    </div>
  );
}
