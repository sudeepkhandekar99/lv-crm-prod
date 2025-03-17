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

interface Client {
    id?: number;
    link: string;
    name: string;
    priority: number;
}

export default function ManageClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newClient, setNewClient] = useState<Client>({
        name: "",
        priority: 1,
        link: "",
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const handleAddClient = async () => {
        try {
            const response = await fetch("https://api.leelavatiautomation.com/clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(newClient),
            });
            if (!response.ok) throw new Error("Failed to add client");
            setIsAddDialogOpen(false);
            fetchClients();
        } catch (error) {
            console.error("Error adding client:", error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await fetch("https://api.leelavatiautomation.com/clients", {
                headers: { accept: "application/json" },
            });
            if (!response.ok) throw new Error("Failed to fetch clients");
            let data = await response.json();
            data = data.sort((a: Client, b: Client) => a.priority - b.priority);
            setClients(data);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    const handleEditClient = async () => {
        if (!selectedClient) return;
        try {
            const response = await fetch(`https://api.leelavatiautomation.com/clients/${selectedClient.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(selectedClient),
            });
            if (!response.ok) throw new Error("Failed to update client");
            setIsEditDialogOpen(false);
            fetchClients();
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };

    const handleDeleteClient = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`https://api.leelavatiautomation.com/clients/${deleteId}`, {
                method: "DELETE",
                headers: { accept: "application/json" },
            });
            if (!response.ok) throw new Error("Failed to delete client");
            setIsDeleteDialogOpen(false);
            fetchClients();
        } catch (error) {
            console.error("Error deleting client:", error);
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
                                <BreadcrumbLink href="#">Manage Clients</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>All Clients</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto mt-10">
                    <div className="flex justify-between mb-4">
                        <h1 className="text-2xl font-bold">Manage Clients</h1>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddDialogOpen(true)}>Add Client</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Client</DialogTitle>
                                </DialogHeader>
                                <Input placeholder="Name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                                <Input placeholder="Priority" type="number" value={newClient.priority} onChange={(e) => setNewClient({ ...newClient, priority: parseInt(e.target.value) })} />
                                <Input placeholder="Image Link" value={newClient.link} onChange={(e) => setNewClient({ ...newClient, link: e.target.value })} />
                                <DialogFooter>
                                    <Button onClick={handleAddClient}>Save</Button>
                                    <Button variant="secondary" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <div className="container mx-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Logo</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.priority}</TableCell>
                                    <TableCell><img src={client.link} className="h-10" alt={client.name} /></TableCell>
                                    <TableCell>
                                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button onClick={() => { setSelectedClient({ ...client }); setIsEditDialogOpen(true); }}>Edit</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Client</DialogTitle>
                                                </DialogHeader>
                                                <Input placeholder="Name" value={selectedClient?.name || ""} onChange={(e) => setSelectedClient(prev => ({ ...prev!, name: e.target.value }))} />
                                                <Input placeholder="Priority" type="number" value={selectedClient?.priority || 0} onChange={(e) => setSelectedClient(prev => ({ ...prev!, priority: parseInt(e.target.value) }))} />
                                                <Input placeholder="Image Link" value={selectedClient?.link || ""} onChange={(e) => setSelectedClient(prev => ({ ...prev!, link: e.target.value }))} />
                                                <DialogFooter>
                                                    <Button onClick={handleEditClient}>Save</Button>
                                                    <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="mx-3" variant="destructive" onClick={() => setDeleteId(client.id!)}>Delete</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                                </DialogHeader>
                                                <p>Are you sure you want to delete this client?</p>
                                                <DialogFooter>
                                                    <Button variant="destructive" onClick={handleDeleteClient}>Confirm</Button>
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
