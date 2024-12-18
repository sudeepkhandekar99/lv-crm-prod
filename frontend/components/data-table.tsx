"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUpdate: () => void; // Callback to refresh data after update
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onUpdate,
}: DataTableProps<TData, TValue>) {
  const [selectedRow, setSelectedRow] = useState<TData | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const formSchema = z.object({
    code: z.string().min(1, { message: "Code is required" }),
    main_cat: z.string().min(1, { message: "Main category is required" }),
    sub_cat: z.string().min(1, { message: "Sub category is required" }),
    brand: z.string().min(1, { message: "Brand is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    housing_size: z.string(),
    function: z.string(),
    range: z.string().nullable(),
    output: z.string(),
    voltage: z.string(),
    connection: z.string(),
    material: z.string(),
    images: z.string().nullable(),
    pdf: z.string().nullable(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      main_cat: "",
      sub_cat: "",
      brand: "",
      model: "",
      housing_size: "",
      function: "",
      range: "",
      output: "",
      voltage: "",
      connection: "",
      material: "",
      images: "",
      pdf: "",
    },
  });

  const { toast } = useToast();
  const { reset, handleSubmit, control } = form;

  // Effect to reset form when a row is selected
  useEffect(() => {
    if (selectedRow) {
      const sanitizedRow = Object.fromEntries(
        Object.entries(selectedRow).map(([key, value]) => [key, value ?? ""])
      );
      reset(sanitizedRow); // Reset the form with sanitized data
    }
  }, [selectedRow, reset]);

  const onSubmit = async (data: any) => {
    if (!selectedRow || !(selectedRow as any).id) {
      toast({
        title: "Error",
        description: "No product selected for update.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${(selectedRow as any).id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const result = await response.json();

      toast({
        title: "Product Updated",
        description: `Product ID: ${result.id} updated successfully.`,
        duration: 3000,
      });

      reset(); // Reset the form on success
      setSelectedRow(null); // Close the sheet
      onUpdate(); // Refresh the data in the table
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Sheet>
                      <SheetTrigger
                        onClick={() => setSelectedRow(row.original)} // Set the selected row's data
                      >
                        Edit
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Edit Product</SheetTitle>
                          <SheetDescription>
                            Modify the selected product's details below.
                          </SheetDescription>
                        </SheetHeader>
                        {selectedRow && (
                          <Form {...form}>
                            <form
                              onSubmit={handleSubmit(onSubmit)}
                              className="grid grid-cols-1 gap-4 md:grid-cols-2"
                            >
                              {Object.keys(formSchema.shape).map((key) => (
                                <FormField
                                  key={key}
                                  control={control}
                                  name={key as keyof typeof formSchema.shape}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {key
                                          .replace(/_/g, " ")
                                          .toLowerCase()
                                          .replace(/\w/g, (char) =>
                                            char.toUpperCase()
                                          )}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={`Enter ${key}`}
                                          {...field}
                                          value={field.value ?? ""} // Ensure value is not null
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ))}
                              <Button type="submit">Update</Button>
                            </form>
                          </Form>
                        )}
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
