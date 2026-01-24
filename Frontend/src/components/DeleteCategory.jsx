import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import "./DeleteCategory.css";
import API_BASE from "../config";

const DeleteCategory = () => {
  const { token } = useUser();
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const flattenCategories = (categories) => {
    const flat = [];
    categories.forEach(category => {
      flat.push({ category_id: category.category_id, category_name: category.category_name });
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(sub => {
          flat.push({ category_id: sub.category_id, category_name: `${category.category_name} > ${sub.category_name}` });
        });
      }
    });
    return flat;
  };

  const getCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products/categories/admin`, { // Fetch admin categories
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(flattenCategories(data));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getCategories();
    }
  }, [token]);

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category \"${categoryName}\"?`)) {
      return;
    }

    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/api/products/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setMessage(`Category \"${categoryName}\" deleted successfully.`);
        getCategories(); // refresh list
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to delete category.");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("An error occurred while deleting the category.");
    }
  };

  return (
    <div>
      <Card className="min-h-screen bg-glass p-4">
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            View, filter and delete existing product categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <p className="mb-4 text-sm font-medium text-green-600">{message}</p>
          )}
          {error && (
            <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
          )}

          {loading ? (
            <p className="text-gray-500 text-center">Loading categories...</p>
          ) : categories.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table className="delete-category-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="text-green-500">Category Name</TableHead>
                    <TableHead className="w-[120px] text-right text-green-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell data-label="ID">{category.category_id}</TableCell>
                      <TableCell data-label="Category Name" className="font-medium">
                        {category.category_name}
                      </TableCell>
                      <TableCell data-label="Actions" className="text-right">
                        <Button
                        className="deletebutton"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDeleteCategory(
                              category.category_id,
                              category.category_name
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1 " />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-sm text-gray-500">No categories found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteCategory;
