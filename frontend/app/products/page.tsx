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
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { Product, columns } from "../../components/columns";
import { DataTable } from "../../components/data-table";
import { Input } from "@/components/ui/input";

async function getData(limit: number = 15, offset: number = 0): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(
    `${baseUrl}/products?limit=${limit}&offset=${offset}`,
    { headers: { accept: "application/json" } }
  );
  if (!response.ok) throw new Error("Failed to fetch products");
  return await response.json();
}

async function searchProducts(
  brand?: string,
  sub_cat?: string,
  main_cat?: string,
  limit: number = 15,
  offset: number = 0
): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const queryParams = new URLSearchParams();
  if (brand) queryParams.append("brand", brand);
  if (sub_cat) queryParams.append("sub_cat", sub_cat);
  if (main_cat) queryParams.append("main_cat", main_cat);
  queryParams.append("limit", limit.toString());
  queryParams.append("offset", offset.toString());

  const response = await fetch(`${baseUrl}/search-products?${queryParams.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Failed to search products");
  return await response.json();
}

async function searchByModel(model: string): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${baseUrl}/search-by-model?model=${model}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) return [];
  return await response.json();
}

export default function Page() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const [dropDownData, setDropDownData] = useState<any>({
    main_categories: [],
    sub_categories: [],
    brands: [],
  });
  const [filters, setFilters] = useState<{
    brand?: string;
    sub_cat?: string;
    main_cat?: string;
  }>({});
  const [searchModel, setSearchModel] = useState<string>("");

  const limit = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      if (searchModel) {
        result = await searchByModel(searchModel);
      } else if (filters.brand || filters.sub_cat || filters.main_cat) {
        result = await searchProducts(
          filters.brand,
          filters.sub_cat,
          filters.main_cat,
          limit,
          offset
        );
      } else {
        result = await getData(limit, offset);
      }
      setData(Array.isArray(result) ? result : [result]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropDownData = () => {
    setLoading(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    fetch(`${baseUrl}/distinct-categories`, { headers: { accept: "application/json" } })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch dropdown data");
        }
        return response.json();
      })
      .then((result) => {
        setDropDownData(result);
      })
      .catch((error) => {
        console.error("Error fetching dropdown data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [offset, filters, searchModel]);

  useEffect(() => {
    fetchDropDownData();
  }, []);

  const from = offset + 1;
  const to = offset + (data.length || 0);

  const handleFilterChange = (filterKey: string, value: string | undefined) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterKey]: value || undefined,
    }));
    setOffset(0); // Reset pagination when a filter is applied
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchModel("");
    setOffset(0);
    window.location.reload(); // Refresh the page to reset the state completely
  };

  const handleSearchModelChange = (value: string) => {
    setSearchModel(value);
    setFilters({}); // Clear all filters when searching by model
    setOffset(0); // Reset pagination
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
        <div className="container mx-auto pt-10">
          <p>Search</p>
        </div>
        <div className="flex container mx-auto pt-2 gap-2">
          <Input
            placeholder="Search by Model"
            value={searchModel}
            onChange={(e) => handleSearchModelChange(e.target.value)}
            className="w-2/3"
          />
          {/* Main Categories Dropdown */}
          <Select
            onValueChange={(value) => handleFilterChange("main_cat", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Main Categories" />
            </SelectTrigger>
            <SelectContent>
              {dropDownData.main_categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Sub Categories Dropdown */}
          <Select
            onValueChange={(value) => handleFilterChange("sub_cat", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sub Categories" />
            </SelectTrigger>
            <SelectContent>
              {dropDownData.sub_categories.map((subCategory: string) => (
                <SelectItem key={subCategory} value={subCategory}>
                  {subCategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Brands Dropdown */}
          <Select
            onValueChange={(value) => handleFilterChange("brand", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Brands" />
            </SelectTrigger>
            <SelectContent>
              {dropDownData.brands.map((brand: string) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            className="px-4 bg-gray-200 rounded hover:bg-red-200"
          >
            Clear
          </button>
        </div>

        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {loading
                ? "Loading Products..."
                : `Showing ${from}–${to} Products`}
            </h2>
          </div>

          {loading ? (
            <div className="border border-gray-200 rounded-md">
              <Skeleton className="h-2 w-full" />
              {[...Array(15)].map((_, i) => (
                <Skeleton key={i} className="h-2 w-full" />
              ))}
            </div>
          ) : (
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
