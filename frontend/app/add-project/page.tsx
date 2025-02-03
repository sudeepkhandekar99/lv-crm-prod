"use client";

import { useState } from "react";
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

interface Project {
  main_title: string;
  subheading: string;
  location: string;
  summary: string;
  image_link: string;
}

export default function AddProject() {
  const [project, setProject] = useState<Project>({
    main_title: "",
    subheading: "",
    location: "",
    summary: "",
    image_link: "",
  });

  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      const response = await fetch("https://api.leelavatiautomation.com/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) throw new Error("Failed to add project");

      toast({ title: "Success", description: "Project added successfully" });

      // Clear the form fields after successful submission
      setProject({
        main_title: "",
        subheading: "",
        location: "",
        summary: "",
        image_link: "",
      });
    } catch (error) {
      console.error("Error adding project:", error);
      toast({ title: "Error", description: "Failed to add project", variant: "destructive" });
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
                  <BreadcrumbPage>Add Project</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto py-10">
          <h1 className="text-2xl font-bold mb-6">Add New Project</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Main Title"
              value={project.main_title}
              onChange={(e) => setProject((prev) => ({ ...prev, main_title: e.target.value }))}
            />
            <Input
              placeholder="Subheading"
              value={project.subheading}
              onChange={(e) => setProject((prev) => ({ ...prev, subheading: e.target.value }))}
            />
            <Input
              placeholder="Location"
              value={project.location}
              onChange={(e) => setProject((prev) => ({ ...prev, location: e.target.value }))}
            />
            <Input
              placeholder="Summary"
              value={project.summary}
              onChange={(e) => setProject((prev) => ({ ...prev, summary: e.target.value }))}
            />
            <Input
              placeholder="Image Link"
              value={project.image_link}
              onChange={(e) => setProject((prev) => ({ ...prev, image_link: e.target.value }))}
            />
          </div>
          <div className="mt-6">
            <Button onClick={handleSubmit}>Save Project</Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
