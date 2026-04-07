import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import GuardianChatPage from '@/pages/GuardianChatPage';
import LabelsInspectorPage from '@/pages/LabelsInspectorPage';
import VRAMPage from '@/pages/VRAMPage';

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
          <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                        <Routes>
                                  <Route element={<AppLayout />}>
                                              <Route path="/" element={<DashboardPage />} />
                                              <Route path="/chat" element={<GuardianChatPage />} />
                                              <Route path="/labels" element={<LabelsInspectorPage />} />
                                              <Route path="/vram" element={<VRAMPage />} />
                                  </Route>Route>
                        </Routes>Routes>
                </BrowserRouter>BrowserRouter>
          </TooltipProvider>TooltipProvider>
    </QueryClientProvider>QueryClientProvider>
  );

export default App;</TooltipProvider>
