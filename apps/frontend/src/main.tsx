import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { AuthProvider } from '@/hooks/useAuth';
import { PartnerVariantProvider } from '@/contexts/PartnerVariantContext';
import { routeConfig } from '@/routes';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const queryClient = createQueryClient();
const router = createBrowserRouter(routeConfig);
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PartnerVariantProvider>
          <RouterProvider router={router} />
        </PartnerVariantProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
