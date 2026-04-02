import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2 } from "lucide-react";
import API_BASE from "../config";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";

const Preorders = () => {
  const { token, user } = useUser();
  const [preorders, setPreorders] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPreorder, setSelectedPreorder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Create preorder modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [preorderProducts, setPreorderProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data for new preorder
  const [newPreorderData, setNewPreorderData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipcode: "",
    notes: ""
  });

  const fetchPreorders = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/preorders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreorders(data);
    } catch (err) {
      console.error("Error fetching preorders:", err);
      toast.error("Failed to load preorders");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreorderProducts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/preorder-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreorderProducts(data);
    } catch (err) {
      console.error("Error fetching preorder products:", err);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchPreorders();
    fetchPreorderProducts();
  }, [token]);

  // Search for products to add to preorder
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    
    const results = preorderProducts.filter(product => 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.variants.some(v => 
        v.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.storage && v.storage.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
    setSearchResults(results);
  }, [searchQuery, preorderProducts]);

  const handleStatusChange = async (preorderId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/api/preorders/${preorderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status updated successfully");
      fetchPreorders();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Error updating status");
    }
  };

  const addProductToPreorder = (product, variant) => {
    const existing = selectedProducts.find(p => p.variant_id === variant.variant_id);
    if (existing) {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.variant_id === variant.variant_id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [
        ...prev,
        {
          variant_id: variant.variant_id,
          product_id: product.product_id,
          product_title: product.title,
          color: variant.color,
          storage: variant.storage,
          ram: variant.ram,
          price: variant.preorder_price || variant.price,
          quantity: 1,
          variant: variant
        }
      ]);
    }
    setSearchQuery("");
  };

  const removeProductFromPreorder = (variantId) => {
    setSelectedProducts(prev => prev.filter(p => p.variant_id !== variantId));
  };

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedProducts(prev => 
      prev.map(p => 
        p.variant_id === variantId 
          ? { ...p, quantity: newQuantity }
          : p
      )
    );
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreatePreorder = async (e) => {
    e.preventDefault();
    
    if (!newPreorderData.name) {
      toast.error("Customer name is required");
      return;
    }
    if (!newPreorderData.phone) {
      toast.error("Phone number is required");
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    setSubmitting(true);
    
    try {
      const payload = {
        name: newPreorderData.name,
        email: newPreorderData.email,
        phone: newPreorderData.phone,
        address: newPreorderData.address,
        city: newPreorderData.city,
        zipcode: newPreorderData.zipcode,
        notes: newPreorderData.notes,
        user_id: null,
        items: selectedProducts.map(p => ({
          variant_id: p.variant_id,
          quantity: p.quantity,
          price: p.price
        })),
        total_amount: calculateTotal()
      };

      await axios.post(`${API_BASE}/api/preorders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Preorder created successfully!");
      setCreateModalOpen(false);
      resetForm();
      fetchPreorders();
    } catch (err) {
      console.error("Error creating preorder:", err);
      toast.error(err.response?.data?.message || "Failed to create preorder");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewPreorderData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipcode: "",
      notes: ""
    });
    setSelectedProducts([]);
    setSearchQuery("");
  };

  const filteredPreorders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return preorders;

    return preorders.filter(preorder =>
      String(preorder.name).toLowerCase().includes(needle) ||
      String(preorder.email).toLowerCase().includes(needle) ||
      String(preorder.phone).toLowerCase().includes(needle) ||
      String(preorder.product_summary).toLowerCase().includes(needle)
    );
  }, [preorders, q]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "contacted": return "bg-blue-500";
      case "processing": return "bg-purple-500";
      case "fulfilled": return "bg-green-600";
      case "cancelled": return "bg-red-600";
      default: return "bg-gray-400";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading) {
    return <p className="text-center py-8">Loading preorders...</p>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Preorders</h2>
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Preorder
        </Button>
      </div>

      <Input
        placeholder="Search by name, email, phone, or products..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4"
      />

      {filteredPreorders.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No preorders found.</p>
      ) : (
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPreorders.map((preorder) => (
                <TableRow key={preorder.preorder_id}>
                  <TableCell>
                    <div className="font-medium">{preorder.name}</div>
                    <div className="text-sm text-gray-500">{preorder.email}</div>
                    <div className="text-sm text-gray-500">{preorder.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm line-clamp-2">{preorder.product_summary}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(preorder.total_amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) => handleStatusChange(preorder.preorder_id, value)}
                      defaultValue={preorder.status}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <Badge className={getStatusColor(preorder.status)}>
                            {preorder.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(preorder.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { data } = await axios.get(
                          `${API_BASE}/api/preorders/${preorder.preorder_id}`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setSelectedPreorder(data);
                        setShowDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Create Preorder Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Preorder</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreatePreorder} className="space-y-6">
            {/* Product Search Section */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">Add Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for products by name, color, or storage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Search Results */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map(product => (
                    <div key={product.product_id} className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="font-medium">{product.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.variants.map(variant => (
                          <Button
                            key={variant.variant_id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addProductToPreorder(product, variant)}
                            className="text-xs"
                          >
                            {variant.color} {variant.storage && `(${variant.storage})`}
                            <span className="ml-1 text-green-600">
                              {formatCurrency(variant.preorder_price || variant.price)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Products List */}
            {selectedProducts.length > 0 && (
              <div>
                <Label className="text-lg font-semibold mb-3 block">Selected Products</Label>
                <div className="border rounded-lg divide-y">
                  {selectedProducts.map(product => (
                    <div key={product.variant_id} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{product.product_title}</div>
                        <div className="text-sm text-gray-500">
                          {product.color} {product.storage && ` • ${product.storage}`} {product.ram && ` • ${product.ram}`}
                        </div>
                        <div className="text-sm font-medium mt-1">{formatCurrency(product.price)} each</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(product.variant_id, product.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="w-12 text-center">{product.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(product.variant_id, product.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <div className="font-medium w-28 text-right">
                          {formatCurrency(product.price * product.quantity)}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductFromPreorder(product.variant_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">Customer Information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newPreorderData.name}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newPreorderData.phone}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPreorderData.email}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    value={newPreorderData.address}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, address: e.target.value })}
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newPreorderData.city}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="zipcode">Postal Code</Label>
                  <Input
                    id="zipcode"
                    value={newPreorderData.zipcode}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, zipcode: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={newPreorderData.notes}
                    onChange={(e) => setNewPreorderData({ ...newPreorderData, notes: e.target.value })}
                    rows={2}
                    placeholder="Any special instructions or notes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || selectedProducts.length === 0}
                className="bg-black dark:bg-white text-white dark:text-black"
              >
                {submitting ? "Creating..." : `Create Preorder (${formatCurrency(calculateTotal())})`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preorder Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preorder Details</DialogTitle>
          </DialogHeader>
          {selectedPreorder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Customer Information</h4>
                  <p><strong>Name:</strong> {selectedPreorder.name}</p>
                  <p><strong>Email:</strong> {selectedPreorder.email}</p>
                  <p><strong>Phone:</strong> {selectedPreorder.phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Shipping Address</h4>
                  <p>{selectedPreorder.address}</p>
                  <p>{selectedPreorder.city}, {selectedPreorder.zipcode}</p>
                </div>
              </div>
              
              {selectedPreorder.notes && (
                <div>
                  <h4 className="font-semibold">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedPreorder.notes}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Ordered Products</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPreorder.products?.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell>{product.color}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{formatCurrency(product.price_at_preorder)}</TableCell>
                        <TableCell>
                          {formatCurrency(product.price_at_preorder * product.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right mt-4 pt-4 border-t">
                  <p className="text-lg font-bold">
                    Total: {formatCurrency(selectedPreorder.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Preorders;