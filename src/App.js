import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RecentlyViewedProvider } from "./context/RecentlyViewedContext";
import { ToastProvider } from "./context/ToastContext";
import { requestNotificationPermission } from "./utils/notifications";
import Wishlist from "./pages/Wishlist";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard";
import Notifications from "./pages/Notifications";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import DeliveryLogin from "./delivery/DeliveryLogin";
import DeliveryDashboard from "./delivery/DeliveryDashboard";
import DeliveryRegister from "./delivery/DeliveryRegister";
import ProductDetail from "./pages/ProductDetail";
import ChatBot from "./components/ChatBot";
import ShopkeeperChat from "./pages/ShopkeeperChat";
import ErrorPage from "./components/ErrorPage";

export default function App() {
  useEffect(() => { requestNotificationPermission(); }, []);
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <BrowserRouter>
                  <Navbar />
                  <ChatBot />
                  <div className="pb-20">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/shopkeeper/dashboard" element={<ShopkeeperDashboard />} />
                    <Route path="/shopkeeper/notifications" element={<Notifications />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/delivery/login" element={<DeliveryLogin />} />
                    <Route path="/delivery/register" element={<DeliveryRegister />} />
                    <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/shopkeeper/chat" element={<ShopkeeperChat />} />
                    <Route path="*" element={<ErrorPage code={404} />} />
                  </Routes>
                  </div>
                </BrowserRouter>
              </RecentlyViewedProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
