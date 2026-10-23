import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

async function TodosList() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <p className="font-semibold mb-1">Notice from Supabase:</p>
        <p className="font-mono text-[11px]">{error.message}</p>
        <p className="mt-2 text-slate-400">
          Note: The FailureTech database schema uses tables such as <code className="text-slate-300">users</code>, <code className="text-slate-300">projects</code>, <code className="text-slate-300">invoices</code>, and <code className="text-slate-300">deliverables</code>. If you haven't created the <code className="text-slate-300">todos</code> table yet, this is expected. Run the FailureTech database migrations in your Supabase SQL editor to load all portal tables.
        </p>
      </div>
    );
  }

  if (todos && todos.length > 0) {
    return (
      <ul className="space-y-2">
        {todos.map((todo: any) => (
          <li
            key={todo.id}
            className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-sm flex items-center justify-between"
          >
            <span>{todo.name || todo.title || JSON.stringify(todo)}</span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {todo.id}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 text-xs text-center">
      Connected to Supabase successfully! The <code className="text-indigo-300">todos</code> table is currently empty.
    </div>
  );
}

export default function TodosPage() {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Supabase Connection Test</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Querying Supabase table <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">todos</code> via <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">@/utils/supabase/server</code>.
        </p>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-6 text-slate-400 text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Connecting to Supabase...</span>
            </div>
          }
        >
          <TodosList />
        </Suspense>
      </div>
    </div>
  );
}
