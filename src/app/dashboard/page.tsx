"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileText, BarChart3, CheckCircle2 } from "lucide-react";
import UserMenu from "@/components/UserMenu";

interface Form {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  createdAt: string;
  isActive: boolean;
  _count?: {
    responses: number;
  };
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded-md bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 animate-pulse rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-4 h-6 w-32 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between">
                  <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
                  <div className="h-8 w-14 animate-pulse rounded-md bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    fetchForms();
  }, [session, status, router]);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms");
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return null;
  }

  const totalResponses = forms.reduce(
    (acc, form) => acc + (form._count?.responses || 0),
    0
  );
  const activeForms = forms.filter((form) => form.isActive).length;
  const avgResponsesPerForm =
    forms.length > 0 ? (totalResponses / forms.length).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {session.user?.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild>
                <Link href="/forms/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Form
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeForms}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Responses / Form
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponsesPerForm}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Your Forms
          </h2>

          {forms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  No forms yet
                </h3>
                <p className="mb-4 text-center text-muted-foreground">
                  Get started by creating your first form
                </p>
                <Button asChild>
                  <Link href="/forms/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Form
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <Card
                  key={form._id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <CardDescription>
                      {form.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {form._count?.responses || 0} responses
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/forms/${form.slug}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/forms/${form.slug}/responses`}>
                          Responses
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/form/${form.slug}`} target="_blank">
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
