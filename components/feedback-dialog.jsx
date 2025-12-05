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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export const FeedbackDialog = ({ open, onOpenChange }) => {
  const [feedback, setFeedback] = useState("");

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share your feedback</DialogTitle>
          <DialogDescription>
            I&apos;d like to hear your thoughts on how I can improve.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="feedback">Your feedback</Label>
          <Textarea
            className="min-h-[120px]"
            id="feedback"
            placeholder="Tell what you think..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
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
