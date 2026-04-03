import { useState, useEffect } from "react";

const NAMES = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Pooja", "Arjun", "Divya", "Karan", "Neha"];
const CITIES = ["Mumbai", "Delhi", "Pune", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Jaipur"];
const ACTIONS = ["just bought", "added to cart", "is viewing"];

export default function LiveNotification({ products }) {
  const [notif, setNotif] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const show = () => {
      const product = products[Math.floor(Math.random() * products.length)];
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      setNotif({ product, name, city, action });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };
    const t = setInterval(show, 8000);
    setTimeout(show, 3000);
    return () => clearInterval(t);
  }, [products]);

  if (!notif || !visible) return null;

  return (
    <div className={`fixed bottom-28 md:bottom-24 left-4 z-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 max-w-xs">
        <img src={notif.product.image} alt={notif.product.name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          onError={(e) => { e.target.src = "https://placehold.co/48x48?text=No"; }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-gray-900">
            <span className="text-orange-500">{notif.name}</span> from {notif.city}
          </p>
          <p className="text-xs text-gray-500 line-clamp-1">
            {notif.action} <span className="font-bold text-gray-700">{notif.product.name}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Just now • 🟢 Live</p>
        </div>
      </div>
    </div>
  );
}
