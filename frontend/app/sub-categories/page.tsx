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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Subcategory {
    id?: number;
    link: string;
    display_name: string;
    priority: number;
    subcat: string;
}

export default function ManageSubcategories() {
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
    const [newSubcategory, setNewSubcategory] = useState<Subcategory>({
        subcat: "",
        display_name: "",
        priority: 0,
        link: "",
    });

    useEffect(() => {
        fetchSubcategories();
    }, []);

    const fetchSubcategories = async () => {
        try {
            const response = await fetch("https://api.leelavatiautomation.com/subcategories", {
                headers: { accept: "application/json" },
            });
            if (!response.ok) throw new Error("Failed to fetch subcategories");
            let data = await response.json();
            data = data.sort((a: Subcategory, b: Subcategory) => a.priority - b.priority);
            setSubcategories(data);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    const handleAddSubcategory = async () => {
        try {
            const response = await fetch("https://api.leelavatiautomation.com/subcategories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(newSubcategory),
            });
            if (!response.ok) throw new Error("Failed to add subcategory");
            setIsAddDialogOpen(false);
            fetchSubcategories();
        } catch (error) {
            console.error("Error adding subcategory:", error);
        }
    };

    const handleEditSubcategory = async () => {
        if (!selectedSubcategory) return;
        try {
            const response = await fetch(`https://api.leelavatiautomation.com/subcategories/${selectedSubcategory.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(selectedSubcategory),
            });
            if (!response.ok) throw new Error("Failed to update subcategory");
            setIsEditDialogOpen(false);
            fetchSubcategories();
        } catch (error) {
            console.error("Error updating subcategory:", error);
        }
    };

    const handleDeleteSubcategory = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`https://api.leelavatiautomation.com/subcategories/${deleteId}`, {
                method: "DELETE",
                headers: { accept: "application/json" },
            });
            if (!response.ok) throw new Error("Failed to delete subcategory");
            setIsDeleteDialogOpen(false);
            fetchSubcategories();
        } catch (error) {
            console.error("Error deleting subcategory:", error);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2 border-b px-3">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Manage Subcategories</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>All Subcategories</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto py-10">
                    <div className="flex justify-between mb-4">
                        <h1 className="text-2xl font-bold">Manage Subcategories</h1>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddDialogOpen(true)}>Add Subcategory</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Subcategory</DialogTitle>
                                </DialogHeader>
                                <Input placeholder="Subcategory" value={newSubcategory.subcat} onChange={(e) => setNewSubcategory({ ...newSubcategory, subcat: e.target.value })} />
                                <Input placeholder="Display Name" value={newSubcategory.display_name} onChange={(e) => setNewSubcategory({ ...newSubcategory, display_name: e.target.value })} />
                                <Input placeholder="Priority" type="number" value={newSubcategory.priority} onChange={(e) => setNewSubcategory({ ...newSubcategory, priority: parseInt(e.target.value) })} />
                                <Input placeholder="Image Link" value={newSubcategory.link} onChange={(e) => setNewSubcategory({ ...newSubcategory, link: e.target.value })} />
                                <Button onClick={handleAddSubcategory}>Save</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subcategories.map((subcategory) => (
                                <TableRow key={subcategory.id}>
                                    <TableCell>{subcategory.display_name}</TableCell>
                                    <TableCell>{subcategory.priority}</TableCell>
                                    <TableCell><img src={subcategory.link} className="h-10" alt={subcategory.display_name} /></TableCell>
                                    <TableCell>
                                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button onClick={() => { setSelectedSubcategory({ ...subcategory }); setIsEditDialogOpen(true); }}>Edit</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Subcategory</DialogTitle>
                                                </DialogHeader>
                                                <Input placeholder="Subcategory" value={selectedSubcategory?.subcat || ""} onChange={(e) => setSelectedSubcategory(prev => ({ ...prev!, subcat: e.target.value }))} />
                                                <Input placeholder="Display Name" value={selectedSubcategory?.display_name || ""} onChange={(e) => setSelectedSubcategory(prev => ({ ...prev!, display_name: e.target.value }))} />
                                                <Input placeholder="Priority" type="number" value={selectedSubcategory?.priority || 0} onChange={(e) => setSelectedSubcategory(prev => ({ ...prev!, priority: parseInt(e.target.value) }))} />
                                                <Input placeholder="Image Link" value={selectedSubcategory?.link || ""} onChange={(e) => setSelectedSubcategory(prev => ({ ...prev!, link: e.target.value }))} />
                                                <Button onClick={handleEditSubcategory}>Save</Button>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="mx-3" variant="destructive" onClick={() => { setDeleteId(subcategory.id!); setIsDeleteDialogOpen(true); }}>Delete</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button variant="destructive" onClick={handleDeleteSubcategory}>Confirm</Button>
                                                    <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
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
