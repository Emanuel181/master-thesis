"use client"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"

export function ModelsDialog({ isOpen, onOpenChange }) {
    const models = [
        { name: "Model 1", description: "Description for Model 1" },
        { name: "Model 2", description: "Description for Model 2" },
        { name: "Model 3", description: "Description for Model 3" },
    ]

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Select AI Model</SheetTitle>
                    <SheetDescription>
                        Choose the AI models you want to use.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    {models.map((model, index) => (
                        <div key={index} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                            <h3 className="font-semibold">{model.name}</h3>
                            <p className="text-sm text-gray-500">{model.description}</p>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

