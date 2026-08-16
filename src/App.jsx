import { Outlet } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-ivory font-body selection:bg-rose-100 selection:text-rose-900">
        <Header />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </AuthProvider>
  )
}