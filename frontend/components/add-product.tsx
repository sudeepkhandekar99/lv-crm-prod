"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"


// Validation schema using Zod
const formSchema = z.object({
    code: z.string().min(1, { message: "Code is required" }),
    main_cat: z.string().min(1, { message: "Main category is required" }),
    sub_cat: z.string().min(1, { message: "Sub category is required" }),
    brand: z.string().min(1, { message: "Brand is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    housing_size: z.string(),
    function: z.string(),
    range: z.string(),
    output: z.string(),
    voltage: z.string(),
    connection: z.string(),
    material: z.string(),
    images: z.string(),
    pdf: z.string(),
});


// ProfileForm component
export default function ProfileForm() {
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

    const { toast } = useToast(); // Moved useToast hook to the top level
    const { reset } = form; // Destructure reset function

    // Submit handler
    const onSubmit = async (data: any) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        accept: "application/json",
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to submit product");
            }

            const result = await response.json();

            // Show success toast
            toast({
                title: "Product Added",
                description: `Product added successfully! ID: ${result.id}`,
                duration: 3000,
            });

            reset(); // Reset the form on success
        } catch (error) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description: "Failed to add product.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.keys(formSchema.shape).map((key) => (
                        <FormField
                            key={key}
                            control={form.control}
                            name={key as keyof typeof formSchema.shape}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {key
                                            .replace(/_/g, " ")
                                            .toLowerCase()
                                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder={`Enter ${key}`} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </>
    );
}
