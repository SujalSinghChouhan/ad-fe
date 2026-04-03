import jsPDF from "jspdf";
import "jspdf-autotable";

export function downloadInvoice(order) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(35, 47, 62);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 153, 0);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("APNI DUKANN", pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Your Local Marketplace", pageWidth / 2, 28, { align: "center" });
  doc.text("www.apnidukann.com", pageWidth / 2, 35, { align: "center" });

  // Invoice title
  doc.setTextColor(35, 47, 62);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 14, 55);

  // Order info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Order ID: #${(order._id || "").slice(0, 8).toUpperCase()}`, 14, 65);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 14, 72);
  doc.text(`Status: ${(order.status || "placed").toUpperCase()}`, 14, 79);
  doc.text(`Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "upi" ? "UPI" : "Card"}`, 14, 86);

  // Bill To
  doc.setFillColor(255, 248, 240);
  doc.rect(14, 93, pageWidth - 28, 30, "F");
  doc.setTextColor(35, 47, 62);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BILL TO:", 18, 103);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${order.customerName}`, 18, 111);
  doc.text(`Phone: ${order.phone || "N/A"}`, 18, 118);
  if (order.deliveryAddress) {
    const addr = doc.splitTextToSize(`Address: ${order.deliveryAddress}`, pageWidth - 36);
    doc.text(addr, 18, 125);
  }

  // Items table
  const tableData = order.items.map((item, i) => [
    i + 1,
    item.productName || item.name,
    item.shopkeeperName || "N/A",
    item.quantity,
    `Rs.${item.price}`,
    `Rs.${item.price * item.quantity}`,
  ]);

  doc.autoTable({
    startY: 135,
    head: [["#", "Product", "Seller", "Qty", "Price", "Total"]],
    body: tableData,
    headStyles: { fillColor: [35, 47, 62], textColor: [255, 153, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 } },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Summary
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  if (order.deliveryCharge === 0) {
    doc.setTextColor(39, 174, 96);
    doc.text("Delivery Charge: FREE", pageWidth - 14, finalY, { align: "right" });
  } else {
    doc.setTextColor(100, 100, 100);
    doc.text(`Delivery Charge: Rs.${order.deliveryCharge || 0}`, pageWidth - 14, finalY, { align: "right" });
  }

  if (order.discount > 0) {
    doc.setTextColor(39, 174, 96);
    doc.text(`Coupon Discount (${order.couponCode}): -Rs.${order.discount}`, pageWidth - 14, finalY + 8, { align: "right" });
  }

  if (order.penaltyCharge > 0) {
    doc.setTextColor(231, 76, 60);
    doc.text(`Penalty Charge: Rs.${order.penaltyCharge}`, pageWidth - 14, finalY + 16, { align: "right" });
  }

  // Total box
  doc.setFillColor(35, 47, 62);
  doc.rect(pageWidth - 80, finalY + 22, 66, 14, "F");
  doc.setTextColor(255, 153, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL: Rs.${order.total}`, pageWidth - 14, finalY + 32, { align: "right" });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Thank you for shopping with Apni Dukann!", pageWidth / 2, finalY + 50, { align: "center" });
  doc.text("For support, contact us at support@apnidukann.com", pageWidth / 2, finalY + 57, { align: "center" });

  doc.save(`Invoice_${(order._id || "").slice(0, 8).toUpperCase()}.pdf`);
}
