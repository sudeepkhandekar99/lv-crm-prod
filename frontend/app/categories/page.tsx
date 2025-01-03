"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

interface Category {
  id?: number;
  image_link: string;
  display_name: string;
  priority: number;
  main_category: string;
}

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("https://api.leelavatiautomation.com/categories", {
        headers: { accept: "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      const sortedData = data.sort((a: Category, b: Category) => a.priority - b.priority);
      setCategories(sortedData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleEdit = async (category: Category) => {
    try {
      const response = await fetch(
        `https://api.leelavatiautomation.com/categories/${category.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(category),
        }
      );

      if (!response.ok) throw new Error("Failed to update category");

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      fetchCategories();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleAdd = async (category: Category) => {
    try {
      const response = await fetch("https://api.leelavatiautomation.com/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) throw new Error("Failed to add category");

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      fetchCategories();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `https://api.leelavatiautomation.com/categories/${id}`,
        {
          method: "DELETE",
          headers: { accept: "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to delete category");

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      fetchCategories();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Manage Categories</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Categories</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto py-10">
          <div className="flex justify-between mb-4">
            <h1 className="text-2xl font-bold">Manage Categories</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <span>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelectedCategory({
                        main_category: "",
                        display_name: "",
                        priority: 0,
                        image_link: "",
                      });
                    }}
                  >
                    Add Category
                  </Button>
                </DialogTrigger>
              </span>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>
                    Enter details for the new category.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedCategory) {
                      handleAdd(selectedCategory);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      placeholder="Main Category"
                      value={selectedCategory?.main_category || ""}
                      onChange={(e) =>
                        setSelectedCategory((prev) => ({
                          ...prev!,
                          main_category: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Display Name"
                      value={selectedCategory?.display_name || ""}
                      onChange={(e) =>
                        setSelectedCategory((prev) => ({
                          ...prev!,
                          display_name: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Priority"
                      type="number"
                      value={selectedCategory?.priority || 0}
                      onChange={(e) =>
                        setSelectedCategory((prev) => ({
                          ...prev!,
                          priority: Number(e.target.value),
                        }))
                      }
                    />
                    <Input
                      placeholder="Image Link"
                      value={selectedCategory?.image_link || ""}
                      onChange={(e) =>
                        setSelectedCategory((prev) => ({
                          ...prev!,
                          image_link: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Main Category</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Image Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.main_category}</TableCell>
                  <TableCell>{category.display_name}</TableCell>
                  <TableCell>{category.priority}</TableCell>
                  <TableCell>{category.image_link}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <span>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedCategory(category);
                              }}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                        </span>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                            <DialogDescription>
                              Modify the category details below.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (selectedCategory) {
                                handleEdit(selectedCategory);
                              }
                            }}
                          >
                            <div className="grid grid-cols-1 gap-4">
                              <Input
                                placeholder="Main Category"
                                value={selectedCategory?.main_category || ""}
                                onChange={(e) =>
                                  setSelectedCategory((prev) => ({
                                    ...prev!,
                                    main_category: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                placeholder="Display Name"
                                value={selectedCategory?.display_name || ""}
                                onChange={(e) =>
                                  setSelectedCategory((prev) => ({
                                    ...prev!,
                                    display_name: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                placeholder="Priority"
                                type="number"
                                value={selectedCategory?.priority || 0}
                                onChange={(e) =>
                                  setSelectedCategory((prev) => ({
                                    ...prev!,
                                    priority: Number(e.target.value),
                                  }))
                                }
                              />
                              <Input
                                placeholder="Image Link"
                                value={selectedCategory?.image_link || ""}
                                onChange={(e) =>
                                  setSelectedCategory((prev) => ({
                                    ...prev!,
                                    image_link: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <span>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setDeleteId(category.id!);
                              }}
                            >
                              Delete
                            </Button>
                          </DialogTrigger>
                        </span>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this category?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                if (deleteId !== null) {
                                  handleDelete(deleteId);
                                }
                              }}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setIsDeleteDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
