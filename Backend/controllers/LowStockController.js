import {
    getLowStockProducts,
} from "../services/LowStock.js";


export const fetchLowStockProducts = async (req, res) => {

    try{
        
        const products = await getLowStockProducts(5);
        res.json(products);
    }catch(err){
        console.error("Error fetching low stock products:", err);
        res.status(500).json({ error: "Failed to fetch low stock products" });
    }

}