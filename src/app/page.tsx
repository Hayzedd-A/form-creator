import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Lock, BarChart3, GraduationCap, ArrowRight } from "lucide-react";

const CAPABILITIES = [
  {
    icon: LayoutGrid,
    title: "Build",
    description:
      "Create forms with a drag-and-drop builder — short text, paragraphs, multiple choice, file uploads, ratings, and more — reordered and configured without writing code.",
  },
  {
    icon: Lock,
    title: "Control access",
    description:
      "Restrict who can respond with email allowlists, limit submissions per person, and set exact open and close windows for when a form accepts responses.",
  },
  {
    icon: BarChart3,
    title: "Collect & analyze",
    description:
      "Every response is stored with full analytics — response counts, completion time, device and location detail — and exportable to CSV or JSON.",
  },
  {
    icon: GraduationCap,
    title: "Grade automatically",
    description:
      "Assignment mode scores submissions against correct answers instantly, calculates grades, and gives a full breakdown per question.",
  },
];

export default async function Home() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">Hayzedd Forms</span>
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <h1 className="text-[2.75rem] font-bold leading-[1.15] tracking-[-0.02em] text-balance">
              Build forms your respondents can trust.
            </h1>
            <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-muted-foreground">
              Structured forms with real access controls, response analytics, and automatic
              grading for assignments — one dependable tool for collecting data you can act on.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <Button asChild size="lg">
                  <Link href="/dashboard" className="inline-flex items-center gap-2">
                    Go to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/auth/signup" className="inline-flex items-center gap-2">
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/auth/signin">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-t border-border bg-secondary">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-semibold tracking-tight">Capabilities</h2>
            <div className="mt-12 grid gap-x-12 gap-y-12 sm:grid-cols-2">
              {CAPABILITIES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                  <div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-2 max-w-[60ch] leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Start building.</h2>
            <p className="mx-auto mt-4 max-w-[50ch] text-muted-foreground">
              Create an account and publish your first form in minutes.
            </p>
            <div className="mt-8 flex justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg">
                  <Link href="/dashboard" className="inline-flex items-center gap-2">
                    Go to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/auth/signup" className="inline-flex items-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span>Hayzedd Forms</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
