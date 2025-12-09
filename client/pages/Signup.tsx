import { Button } from "@/components/ui/button";

export default function Signup() {
  return (
    <section className="container py-12">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Create account</h1>
        <div className="grid gap-4">
          <Button asChild size="lg"><a href="/signup/user">Sign up as a User</a></Button>
          <Button asChild size="lg" variant="outline"><a href="/signup/admin">Sign up as an Administrator</a></Button>
          <div className="mt-2 text-center text-sm text-muted-foreground">Already have an account? <a className="text-primary hover:underline" href="/login">Login</a></div>
        </div>
      </div>
    </section>
  );
}
