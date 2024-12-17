"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Product = {
  id: number;
  code: string | null;
  main_cat: string;
  sub_cat: string;
  brand: string;
  model: string;
  housing_size: string;
  function: string | null;
  range: string | null;
  output: string;
  voltage: string | null;
  connection: string;
  material: string;
  images: string | null;
  pdf: string | null;
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "main_cat",
    header: "Main Category",
  },
  {
    accessorKey: "sub_cat",
    header: "Sub Category",
  },
  {
    accessorKey: "brand",
    header: "Brand",
  },
]
