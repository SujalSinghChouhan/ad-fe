export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function sendPushNotification(title, body, icon = "🛒") {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export function notifyOrderStatus(status, orderId) {
  const messages = {
    accepted:         { title: "✅ Order Accepted!", body: `Your order #${orderId} has been accepted by the shopkeeper.` },
    out_for_delivery: { title: "🛵 Out for Delivery!", body: `Your order #${orderId} is on the way!` },
    delivered:        { title: "🎉 Order Delivered!", body: `Your order #${orderId} has been delivered. Enjoy!` },
    cancelled:        { title: "❌ Order Cancelled", body: `Your order #${orderId} has been cancelled.` },
  };
  const msg = messages[status];
  if (msg) sendPushNotification(msg.title, msg.body);
}
