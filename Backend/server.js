
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import authRoutes from './routes/authApi.js'; 
import productRoutes from './routes/productApi.js';
import ordersRoutes from './routes/ordersApi.js';
import orderItemsRoutes from "./routes/OrderItemsApi.js";
import analyticsRoutes from "./routes/analyticsApi.js";
import LowStock from "./routes/LowStockApi.js";
import ProfitAnalytics from "./routes/ProfitAnalyticsApi.js";
import mpesaRoutes from "./routes/mpesaApi.js"; 
import heroslideRoutes from "./routes/heroSlideApi.js";
import galleryRoutes from './routes/galleryApi.js';
import Featured from "./routes/FeaturedApi.js";
import path from 'path';
import { fileURLToPath } from 'url';
import preorder from './routes/preorderApi.js';
import productPromotionApi from "./routes/productPromotionApi.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

db.getConnection()
 .then(connection => {
 console.log('Connected to database');
 connection.release();
 })

 
 
 .catch(err => {
 console.error('Error connecting to database:', err);
 });

app.use(cors());
app.use(express.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// mount API routes
app.use('/api', authRoutes); 
app.use("/api/products", productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orderitems', orderItemsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/productpromotion", productPromotionApi);

app.use('/api/profit', ProfitAnalytics)
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/heroslide", heroslideRoutes);
app.use("/api/lowstock", LowStock);
app.use("/api/featured", Featured);
app.use('/api/gallery', galleryRoutes);
app.use('/api', preorder);




if(process.env.NODE_ENV === "production") {
    
    const frontendPath = path.join(__dirname, '..', 'Frontend', 'dist');
    
  
    app.use(express.static(frontendPath));
    
 
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(frontendPath, 'index.html'));
    });
}



app.use((err, req, res, next) => {
 console.error(err.stack);
 res.status(500).json({ message: "Something went wrong!" });
});


if (process.env.NODE_ENV !== "production") {
    app.use((req, res) => {
        res.status(404).json({ message: "Route not found" });
    });
}


app.listen(PORT, () => {
 console.log(`Server is running on port ${PORT}`);
});

