import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function DescriptionDialog({ title, description, children }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] whitespace-pre-wrap break-words">
                    <div className="text-sm text-muted-foreground pr-4">
                        {description}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

