import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";

const slides = [
  {
    title: "Report civic issues instantly",
    desc: "Capture a photo, add a short note, and submit in seconds.",
  },
  {
    title: "Verify and upvote nearby reports",
    desc: "Your community helps validate and prioritize issues.",
  },
  {
    title: "Transparent resolution tracking",
    desc: "Follow progress from submission to resolution.",
  },
];

export function Onboarding() {
  const [seen, setSeen] = useLocalStorage("onboarding-seen", false);
  const open = !seen;
  useEffect(() => {
    if (!seen) return;
  }, [seen]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Sahayak</DialogTitle>
          <DialogDescription>
            <div className="mt-4 grid gap-6">
              {slides.map((s, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setSeen(true)}>Get started</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
