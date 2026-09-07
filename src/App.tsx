import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DirectoryModule } from './components/modules/DirectoryModule';
import { ExploitationModule } from './components/modules/ExploitationModule';
import { CaisseModule } from './components/modules/CaisseModule';
import { RHModule } from './components/modules/RHModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { ContratsModule } from './components/modules/ContratsModule';
import { JuridiqueModule } from './components/modules/JuridiqueModule';
import { SecretariatModule } from './components/modules/SecretariatModule';
import { DocumentsModule } from './components/modules/DocumentsModule';
import { AdminModule } from './components/modules/AdminModule';
import { VaultModule } from './components/modules/VaultModule';
import { EmergencyModule } from './components/modules/EmergencyModule';
import { GenericServiceModule } from './components/modules/GenericServiceModule';
import { ModalManager } from './components/modals/ModalManager';

const MainContent: React.FC = () => {
  const { currentUser, activeTab } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderContent = () => {
    if (activeTab.startsWith('service-')) {
      const sId = activeTab.replace('service-', '');
      return <GenericServiceModule serviceId={sId} />;
    }
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'directory': return <DirectoryModule />;
      case 'documents': return <DocumentsModule />;
      case 'vault': return <VaultModule />;
      case 'emergency': return <EmergencyModule />;
      case 'expl': return <ExploitationModule />;
      case 'caisse': return <CaisseModule />;
      case 'rh': return <RHModule />;
      case 'finance': return <FinanceModule />;
      case 'contrats': return <ContratsModule />;
      case 'juridique': return <JuridiqueModule />;
      case 'secretariat': return <SecretariatModule />;
      case 'admin-users': return <AdminModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <ModalManager />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
