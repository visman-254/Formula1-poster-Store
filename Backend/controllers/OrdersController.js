// src/controllers/OrdersController.js
import { getOrders, createOrder, giveAllOrders, updateOrderStatus, checkAndMarkBackorder, getBackorderedOrdersData } from "../services/orders.js";
import { createOrderItem } from "../services/OrderItems.js";
import { sendOrderCreationNotification } from "../services/whatsapp.js";

// Helper to format image URLs consistently across the application
const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return null; // Handle null or empty paths

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Assuming the imagePath stored in DB is relative to the "uploads" directory
  const normalizedPath = imagePath.startsWith('uploads/images/') ? imagePath : `uploads/images/${imagePath}`;
  
  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

// Controller: Get all orders for a user
export const getAllOrders = async (req, res) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(403).json({ message: "Forbidden: No user found in token" });

    const orders = await getOrders(user_id);

    const formattedOrders = orders.map(order => ({
      ...order,
      status: order.order_type === 'pos' ? 'delivered' : order.status,
      items: order.items.map(item => ({
        ...item,
        image: formatImageUrl(req, item.image) 
      }))
    }));

    console.log('Formatted Orders:', JSON.stringify(formattedOrders, null, 2));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: Create new order
export const createNewOrder = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { total, status, items, mpesa_merchant_request_id } = req.body; 

    console.log('Creating new order with items:', JSON.stringify(items, null, 2));

    if (!user_id) return res.status(403).json({ message: "Forbidden: No user found in token" });

    if (!total || !items || items.length === 0) {
      return res.status(400).json({ message: "Total and items are required" });
    }

    const orderId = await createOrder(user_id, total, status, mpesa_merchant_request_id);

    for (const item of items) {
      await createOrderItem(
            orderId, 
            item.variant_id, 
            item.quantity, 
            item.price, 
            item.name,       
            item.image || item.product_image
        );
    }

    await checkAndMarkBackorder(orderId);
    
    res.status(201).json({ message: "Order created", orderId });  
} catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: Get all orders (admin)
export const fetchAllOrders = async (req, res) => {
  try {
    const { q } = req.query; // Get the search query from the URL
    const orders = await giveAllOrders();

    const formattedOrders = orders.map(order => {
      const isPos = order.order_type === 'pos' || (order.sales_person_id != null);
      return {
        ...order,
        order_type: isPos ? 'pos' : (order.order_type || 'online'),
        status: isPos ? 'delivered' : order.status,
        items: order.items.map(item => ({
          ...item,
          image: formatImageUrl(req, item.image)
        }))
      };
    });

    if (q) {
      const needle = q.trim().toLowerCase();
      const filteredOrders = formattedOrders.filter(order =>
        order.status.toLowerCase().includes(needle) ||
        (order.user && order.user.username.toLowerCase().includes(needle))
      );
      return res.json(filteredOrders);
    }

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching ALL orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: Update order status
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const updatedOrder = await updateOrderStatus(orderId, status);

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const haveBackorders = async (req, res) => {
 try {
    const backorderedOrders = await getBackorderedOrdersData();
    res.json(backorderedOrders);
  } catch (error) {
    console.error("Error fetching backordered orders:", error);
    res.status(500).json({ message: "Server error" });
  }
}