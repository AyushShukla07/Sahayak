export default function AdminSettings(){
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="rounded border p-4">
        <div className="text-sm text-muted-foreground">Configure routing rules, notifications and appearance.</div>
        <div className="mt-3 grid gap-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4"/> Auto-assign issues to departments</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4"/> Enable dark mode (follows system)</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4"/> Email alerts for escalated issues</label>
        </div>
      </div>
    </div>
  );
}
