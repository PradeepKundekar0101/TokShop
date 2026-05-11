import type { TokshopOrder } from "./schema";

/**
 * Centralized order total calculation function
 * Handles proper currency conversion and business logic consistently
 */
export function calculateOrderTotal(order: TokshopOrder): number {
  if (!order) return 0;

  // Calculate actual subtotal from item quantities and prices
  const itemsSubtotal = order.items 
    ? order.items.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        return sum + (quantity * price);
      }, 0)
    : 0;
  
  // Add fees and taxes to the items subtotal
  const serviceFee = order.servicefee || 0;
  const tax = order.tax || 0;
  const shippingFee = order.shipping_fee || 0;
  const discount = order.discount || 0;
  
  // Calculate the total: items subtotal + fees + tax + shipping - discount
  const total = itemsSubtotal + serviceFee + tax + shippingFee - discount;
  
  return total;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate order subtotal (items only, before fees and taxes)
 */
export function calculateOrderSubtotal(order: TokshopOrder): number {
  if (!order?.items) return 0;
  
  return order.items.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    return sum + (quantity * price);
  }, 0);
}

/**
 * Get order breakdown for detailed display
 */
export function getOrderBreakdown(order: TokshopOrder) {
  const subtotal = calculateOrderSubtotal(order);
  const serviceFee = order.servicefee || 0;
  const tax = order.tax || 0;
  const shippingFee = order.shipping_fee || 0;
  const discount = order.discount || 0;
  const total = calculateOrderTotal(order);
  
  return {
    subtotal,
    serviceFee,
    tax,
    shippingFee,
    discount,
    total,
  };
}