import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/globals.css'
import App from './App'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Addresses from './pages/adresses'
import Orders from './pages/Orders'
import VirtualTryOn from './components/VirtualTryOn'
import Wishlist from './pages/Wishlist'
import { AuthProvider } from './context/AuthContext'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "products",
        element: <Products />
      },
      {
        path: "product/:id",
        element: <ProductDetail />
      },
      {
        path: "virtual-try-on/:productId",
        element: <VirtualTryOn />
      },
      {
        path: "cart",
        element: <Cart />
      },
      {
        path: "wishlist",
        element: <Wishlist />
      },
      {
        path: "checkout",
        element: <Checkout />
      },
      {
        path: "addresses",
        element: <Addresses />
      },
      {
        path: "success",
        element: <OrderSuccess />
      },
      {
        path: "orders",
        element: <Orders />
      },
      {
        path: "admin",
        element: <Admin />
      },
      {
        path: "profile",
        element: <Profile />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
)