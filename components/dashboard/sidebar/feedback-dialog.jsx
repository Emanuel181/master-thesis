import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const FeedbackDialog = ({ open, onOpenChange }) => {
  const [feedback, setFeedback] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (response.ok) {
        toast.success("Feedback submitted successfully!");
        setFeedback("");
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error("Error submitting feedback");
    }
  };

  const handleInput = (e) => {
    setFeedback(e.currentTarget.textContent || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Share your feedback</DialogTitle>
          <DialogDescription>
            I&apos;d like to hear your thoughts on how I can improve.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="feedback">Your feedback</Label>
          <ScrollArea className="h-[120px] w-full rounded-md border border-input bg-transparent overflow-hidden">
            <div
              ref={textareaRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              id="feedback"
              data-placeholder="Tell what you think..."
              onInput={handleInput}
              className="min-h-[120px] w-full px-3 py-2 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground break-all"
              suppressContentEditableWarning
            />
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
