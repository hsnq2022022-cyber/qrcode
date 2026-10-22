import { useState, useEffect, useCallback } from 'react';
import { Screen, StoreSettings } from './types';
import { getSettings } from './db';
import BottomNav from './components/BottomNav';
import ScannerScreen from './screens/ScannerScreen';
import ProductsScreen from './screens/ProductsScreen';
import AddProductScreen from './screens/AddProductScreen';
import SettingsScreen from './screens/SettingsScreen';

function App() {
  const [screen, setScreen] = useState<Screen>('scanner');
  const [previousScreen, setPreviousScreen] = useState<Screen>('scanner');
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '',
    logo: null,
    primaryColor: '#0d9488',
  });
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleAddFromScanner = (barcode: string) => {
    setPendingBarcode(barcode);
    setPreviousScreen('scanner');
    setScreen('add');
  };

  const handleEditProduct = (barcode: string) => {
    setPendingBarcode(barcode);
    setPreviousScreen('products');
    setScreen('add');
  };

  const handleProductSaved = () => {
    setPendingBarcode(null);
    setScreen(previousScreen);
  };

  const handleAddCancel = () => {
    setPendingBarcode(null);
    setScreen(previousScreen);
  };

  const handleNavChange = (newScreen: Screen) => {
    setPreviousScreen(screen);
    setScreen(newScreen);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'scanner':
        return <ScannerScreen settings={settings} onAddProduct={handleAddFromScanner} />;
      case 'products':
        return <ProductsScreen settings={settings} onEdit={handleEditProduct} />;
      case 'add':
        return (
          <AddProductScreen
            settings={settings}
            initialBarcode={pendingBarcode}
            onSaved={handleProductSaved}
            onCancel={handleAddCancel}
          />
        );
      case 'settings':
        return <SettingsScreen settings={settings} onSettingsSaved={loadSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden bg-surface">
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>
      <BottomNav current={screen} onChange={handleNavChange} primaryColor={settings.primaryColor} />
    </div>
  );
}

export default App;
