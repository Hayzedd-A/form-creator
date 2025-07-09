import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Form Creator
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build dynamic forms, collect responses, and analyze data with our powerful form builder platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>🏗️ Build Forms</CardTitle>
              <CardDescription>
                Create forms with multiple field types including text, multiple choice, file uploads, and ratings.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>📊 Collect Data</CardTitle>
              <CardDescription>
                Share forms via public links and collect responses with advanced settings like email restrictions.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>📈 Analyze Results</CardTitle>
              <CardDescription>
                View responses in tables, charts, and export to CSV for deeper analysis.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">🔐 Secure Authentication</h3>
              <p className="text-sm text-gray-600">Email/password authentication with NextAuth</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">🎨 Drag & Drop Builder</h3>
              <p className="text-sm text-gray-600">Intuitive form builder with reorderable fields</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">☁️ File Uploads</h3>
              <p className="text-sm text-gray-600">Image uploads with Cloudinary integration</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">📱 Responsive Design</h3>
              <p className="text-sm text-gray-600">Works perfectly on desktop and mobile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}