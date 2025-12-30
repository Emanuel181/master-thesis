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

export const FeedbackDialog = ({ open, onOpenChange, isDemo = false }) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter some feedback");
      return;
    }

    // Demo mode - mock the submission
    if (isDemo) {
      setIsSubmitting(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success("Feedback submitted successfully! (Demo Mode)");
      setFeedback("");
      if (textareaRef.current) {
        textareaRef.current.textContent = "";
      }
      setIsSubmitting(false);
      onOpenChange(false);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (response.ok) {
        toast.success("Feedback submitted successfully!");
        setFeedback("");
        if (textareaRef.current) {
          textareaRef.current.textContent = "";
        }
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error("Error submitting feedback");
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
