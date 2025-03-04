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

interface Brands {
    id?: number;
    aws_link: string;
    display_name: string;
    priority: number;
    brand: string;
}

export default function ManageCategories() {
    const [brands, setBrands] = useState<Brands[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<Brands | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await fetch("https://api.leelavatiautomation.com/brands", {
                headers: { accept: "application/json" },
            });

            if (!response.ok) throw new Error("Failed to fetch categories");

            const data = await response.json();
            const sortedData = data.sort((a: Brands, b: Brands) => a.priority - b.priority);
            setBrands(sortedData);
        } catch (error) {
            console.error("Error fetching brands:", error);
        }
    };

    const handleEdit = async (brand: Brands) => {
        try {
            const response = await fetch(
                `https://api.leelavatiautomation.com/brands/${brand.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        accept: "application/json",
                    },
                    body: JSON.stringify(brand),
                }
            );

            if (!response.ok) throw new Error("Failed to update brand");

            const result = await response.json();

            toast({
                title: "Success",
                description: result.message,
            });

            fetchBrands();
            setIsEditDialogOpen(false);
        } catch (error) {
            console.error("Error updating brand:", error);
        }
    };

    const handleAdd = async (brand: Brands) => {
        try {
            const response = await fetch("https://api.leelavatiautomation.com/brands", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(brand),
            });

            if (!response.ok) throw new Error("Failed to add brand");

            const result = await response.json();

            toast({
                title: "Success",
                description: result.message,
            });

            fetchBrands();
            setIsAddDialogOpen(false);
        } catch (error) {
            console.error("Error adding brand:", error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(
                `https://api.leelavatiautomation.com/brands/${id}`,
                {
                    method: "DELETE",
                    headers: { accept: "application/json" },
                }
            );

            if (!response.ok) throw new Error("Failed to delete brand");

            const result = await response.json();

            toast({
                title: "Success",
                description: result.message,
            });

            fetchBrands();
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error deleting brand:", error);
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
                                    <BreadcrumbLink href="#">Manage Brands</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>All Brands</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10">
                    <div className="flex justify-between mb-4">
                        <h1 className="text-2xl font-bold">Manage Brands</h1>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <span>
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={() => {
                                            setSelectedBrand({
                                                brand: "",
                                                display_name: "",
                                                priority: 0,
                                                aws_link: "",
                                            });
                                        }}
                                    >
                                        Add Brand
                                    </Button>
                                </DialogTrigger>
                            </span>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Brand</DialogTitle>
                                    <DialogDescription>
                                        Enter details for the new brand.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (selectedBrand) {
                                            handleAdd(selectedBrand);
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input
                                            placeholder="Main Brand"
                                            value={selectedBrand?.brand || ""}
                                            onChange={(e) =>
                                                setSelectedBrand((prev) => ({
                                                    ...prev!,
                                                    brand: e.target.value,
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="Display Name"
                                            value={selectedBrand?.display_name || ""}
                                            onChange={(e) =>
                                                setSelectedBrand((prev) => ({
                                                    ...prev!,
                                                    display_name: e.target.value,
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="Priority"
                                            type="number"
                                            value={selectedBrand?.priority || 0}
                                            onChange={(e) =>
                                                setSelectedBrand((prev) => ({
                                                    ...prev!,
                                                    priority: Number(e.target.value),
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="Image Link"
                                            value={selectedBrand?.aws_link || ""}
                                            onChange={(e) =>
                                                setSelectedBrand((prev) => ({
                                                    ...prev!,
                                                    aws_link: e.target.value,
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
                                <TableHead>Main Brand</TableHead>
                                <TableHead>Display Name</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Image Link</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {brands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell>{brand.brand}</TableCell>
                                    <TableCell>{brand.display_name}</TableCell>
                                    <TableCell>{brand.priority}</TableCell>
                                    <TableCell><img src={brand.aws_link} alt={brand.display_name} className="h-10" /></TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                                <span>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedBrand(brand);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </DialogTrigger>
                                                </span>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Brand</DialogTitle>
                                                        <DialogDescription>
                                                            Modify the brand details below.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            if (selectedBrand) {
                                                                handleEdit(selectedBrand);
                                                            }
                                                        }}
                                                    >
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <Input
                                                                placeholder="Main Brand"
                                                                value={selectedBrand?.brand || ""}
                                                                onChange={(e) =>
                                                                    setSelectedBrand((prev) => ({
                                                                        ...prev!,
                                                                        brand: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Display Name"
                                                                value={selectedBrand?.display_name || ""}
                                                                onChange={(e) =>
                                                                    setSelectedBrand((prev) => ({
                                                                        ...prev!,
                                                                        display_name: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Priority"
                                                                type="number"
                                                                value={selectedBrand?.priority || 0}
                                                                onChange={(e) =>
                                                                    setSelectedBrand((prev) => ({
                                                                        ...prev!,
                                                                        priority: Number(e.target.value),
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Image Link"
                                                                value={selectedBrand?.aws_link || ""}
                                                                onChange={(e) =>
                                                                    setSelectedBrand((prev) => ({
                                                                        ...prev!,
                                                                        aws_link: e.target.value,
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
                                                                setDeleteId(brand.id!);
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
                                                            Are you sure you want to delete this brand?
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