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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Project {
  id?: number;
  main_title: string;
  subheading: string;
  location: string;
  summary: string;
  image_link: string;
}

export default function ManageProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("https://api.leelavatiautomation.com/projects", {
        headers: { accept: "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      
      // Sort by id in ascending order
      const sortedData = data.sort((a: Project, b: Project) => (a.id || 0) - (b.id || 0));

      setProjects(sortedData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleUpdate = async (project: Project) => {
    try {
      const response = await fetch(
        `https://api.leelavatiautomation.com/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(project),
        }
      );

      if (!response.ok) throw new Error("Failed to update project");
      toast({ title: "Success", description: "Project updated successfully" });
      fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(
        `https://api.leelavatiautomation.com/projects/${deleteId}`,
        {
          method: "DELETE",
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to delete project");

      toast({ title: "Success", description: "Project deleted successfully" });
      setIsDeleteDialogOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
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
                  <BreadcrumbLink href="#">Manage Projects</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Projects</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold mb-4">Manage Projects</h1>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>ID</TableHead> */}
                <TableHead>Main Title</TableHead>
                <TableHead>Subheading</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Image Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  {/* <TableCell>{project.id}</TableCell> */}
                  <TableCell>
                    <Input
                      value={project.main_title}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id
                              ? { ...p, main_title: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={project.subheading}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id
                              ? { ...p, subheading: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={project.location}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id
                              ? { ...p, location: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={project.summary}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id
                              ? { ...p, summary: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={project.image_link}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === project.id
                              ? { ...p, image_link: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleUpdate(project)}>Save</Button>
                      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={() => setDeleteId(project.id!)}
                          >
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this project?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="destructive" onClick={handleDelete}>
                              Confirm
                            </Button>
                            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
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
