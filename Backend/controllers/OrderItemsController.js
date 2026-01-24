import {
  createOrderItem,
  getOrdersByVariantId,
  getFullOrderDetails,
  getOrdersByUser
} from "../services/OrderItems.js";

// Create a new order item
export const createOrder = async (req, res) => {
  try {
    const { order_id, variant_id, quantity, price } = req.body;
    const newOrderItemId = await createOrderItem(order_id, variant_id, quantity, price);
    res.status(201).json({ id: newOrderItemId, message: "Order item created successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error creating order item" });
  }
};

// Get orders by product
export const getOrdersByVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const orders = await getOrdersByVariantId(variantId);
    res.json(orders);
  } catch (error) {
    console.error("Error getting orders by product:", error);
    res.status(500).json({ message: "Server error fetching orders by product" });
  }
};

// Get full order details
export const fetchFullOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderDetails = await getFullOrderDetails(orderId);
    res.json(orderDetails);
  } catch (error) {
    console.error("Error getting full order details:", error);
    res.status(500).json({ message: "Server error fetching full order details" });
  }
};

// Fetch user's orders
export const fetchUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await getOrdersByUser(userId);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};