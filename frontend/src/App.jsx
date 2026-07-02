import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppContext } from './hooks/useAppContext.jsx'
import { useNotificationPolling } from './hooks/useNotificationPolling.js'
import Navbar from './components/Navbar.jsx'
import ToastStack from './components/ToastStack.jsx'
import AIAssistant from './components/AIAssistant.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DisruptionRecovery from './pages/DisruptionRecovery.jsx'
import AlternateFlights from './pages/AlternateFlights.jsx'
import RefundPage from './pages/RefundPage.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import VoucherWallet from './pages/VoucherWallet.jsx'
import BoardingPass from './pages/BoardingPass.jsx'
import GroupRecovery from './pages/GroupRecovery.jsx'
import OpsDashboard from './pages/OpsDashboard.jsx'
import BaggagePage from './pages/BaggagePage.jsx'

function ProtectedRoute({ children }) {
  const { session } = useAppContext()
  if (!session) return <Navigate to="/" replace />
  return children
}

function AppContent() {
  useNotificationPolling(30000)
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/recovery" element={<ProtectedRoute><DisruptionRecovery /></ProtectedRoute>} />
        <Route path="/recovery/alternates" element={<ProtectedRoute><AlternateFlights /></ProtectedRoute>} />
        <Route path="/recovery/refund" element={<ProtectedRoute><RefundPage /></ProtectedRoute>} />
        <Route path="/recovery/group" element={<ProtectedRoute><GroupRecovery /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/vouchers" element={<ProtectedRoute><VoucherWallet /></ProtectedRoute>} />
        <Route path="/boarding-pass" element={<ProtectedRoute><BoardingPass /></ProtectedRoute>} />
        <Route path="/baggage" element={<ProtectedRoute><BaggagePage /></ProtectedRoute>} />
        <Route path="/ops" element={<OpsDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastStack />
      <AIAssistant />
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <AppContent />
    </div>
  )
}
