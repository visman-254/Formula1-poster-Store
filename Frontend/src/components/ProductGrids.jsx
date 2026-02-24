import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import GlassmorphicContainer from "./GlassmorphicContainer";
import API_BASE from "../config";

const ProductGrids = () => {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/products/admin`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (mounted) setProducts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p && (
          String(p.title || "").toLowerCase().includes(needle) ||
          String(p.description || "").toLowerCase().includes(needle) ||
          String(p.product_id || "").includes(needle)
        )
    );
  }, [products, q]);

  const handleDeleted = (id) => {
    setProducts((list) => list.filter((p) => p && p.product_id !== id));
  };

  const handleUpdated = (updated) => {
    if (!updated) return;
    
    setProducts((list) => {
      // If it's a full product object with product_id
      if (updated.product_id) {
        return list.map((p) => (p && p.product_id === updated.product_id ? updated : p));
      }
      
      // If it's a variant, find and update the parent product
      if (updated.variant_id) {
        return list.map((product) => {
          if (!product || !product.variants) return product;
          
          const variantIndex = product.variants.findIndex(v => v.variant_id === updated.variant_id);
          if (variantIndex !== -1) {
            const updatedVariants = [...product.variants];
            updatedVariants[variantIndex] = { ...updatedVariants[variantIndex], ...updated };
            return { ...product, variants: updatedVariants };
          }
          return product;
        });
      }
      
      return list;
    });
  };

  if (loading) return <div className="p-4 text-black dark:text-white">Loading products…</div>;

  return (
    <GlassmorphicContainer>
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="p-0">
          <Input
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mb-4 bg-white/50 dark:bg-black/50 border-gray-300 dark:border-gray-600 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
              <thead className="bg-transparent">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    WAC
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Stock Value
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {filtered.length > 0 ? (
                  filtered.map((product) => (
                    product && (
                      <ProductCard
                        key={product.product_id}
                        product={product}
                        onDeleted={handleDeleted}
                        onUpdated={handleUpdated}
                      />
                    )
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </GlassmorphicContainer>
  );
};

export default ProductGrids;