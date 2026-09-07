import React from 'react';
import { useApp } from '../../context/AppContext';
import { AuthModal } from './AuthModal';
import { UserModal } from './UserModal';
import { ContractModal } from './ContractModal';
import { MailModal } from './MailModal';
import { DocumentModal } from './DocumentModal';
import { ServiceModal } from './ServiceModal';
import { ConfirmModal } from './ConfirmModal';
import { GeminiAiModal } from './GeminiAiModal';

export const ModalManager: React.FC = () => {
  const { modalState } = useApp();

  if (!modalState.type) return null;

  switch (modalState.type) {
    case 'auth_switch': return <AuthModal />;
    case 'add_user': return <UserModal />;
    case 'add_contract': return <ContractModal />;
    case 'add_mail': return <MailModal />;
    case 'upload_doc': return <DocumentModal />;
    case 'service':
    case 'add_service': return <ServiceModal />;
    case 'confirm': return <ConfirmModal />;
    case 'gemini_ai': return <GeminiAiModal />;
    default: return null;
  }
};
