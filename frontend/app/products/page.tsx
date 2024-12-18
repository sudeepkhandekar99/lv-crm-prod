"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { Product, columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";


async function getData(limit: number = 15, offset: number = 0): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(
    `${baseUrl}/products?limit=${limit}&offset=${offset}`,
    { headers: { "accept": "application/json" } }
  );
  if (!response.ok) throw new Error("Failed to fetch products");
  return await response.json();
}

export default function Page() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const limit = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getData(limit, offset);
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [offset]);

  const from = offset + 1; // Starting product number
  const to = offset + (data.length || 0); // Ending product number

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
                  <BreadcrumbLink href="#">Manage Products</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Products</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto pt-10 ">
          <p>Search</p>
        </div>
        <div className="flex container mx-auto pt-2 gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

        </div>

        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {loading
                ? "Loading Products..."
                : `Showing ${from}–${to} Products`}
            </h2>
          </div>

          {/* Skeleton Table */}
          {loading ? (
            <div className="border border-gray-200 rounded-md">
              <div className="grid grid-cols-6 gap-2 p-4 bg-gray-100">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-6 gap-2 p-4 border-b border-gray-200"
                >
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : (
            // Pass fetchData as a prop to trigger re-fetching after update
            <DataTable columns={columns} data={data} onUpdate={fetchData} />
          )}

          <div className="flex items-center justify-end space-x-2 py-4">
            <button
              onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
              disabled={offset === 0 || loading}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
