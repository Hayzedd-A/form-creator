import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Star,
  Play,
  Sparkles,
  TrendingUp
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-20">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            Trusted by 10,000+ users worldwide
          </Badge>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Create Forms That
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Actually Convert
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Build stunning forms, collect valuable responses, and turn data into insights. 
            No coding required – just drag, drop, and deploy.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Start Building Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild size="lg" className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:bg-blue-50">
              <Link href="/auth/signin" className="flex items-center gap-2">
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🏗️</span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Build Forms</CardTitle>
              <CardDescription className="text-gray-600">
                Create forms with multiple field types including text, multiple choice, file uploads, and ratings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <Zap className="w-4 h-4" />
                Drag & drop builder
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📊</span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Collect Data</CardTitle>
              <CardDescription className="text-gray-600">
                Share forms via public links and collect responses with advanced settings like email restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <Users className="w-4 h-4" />
                Unlimited responses
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📈</span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Analyze Results</CardTitle>
              <CardDescription className="text-gray-600">
                View responses in tables, charts, and export to CSV for deeper analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <BarChart3 className="w-4 h-4" />
                Real-time analytics
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Powerful features designed to help you create, share, and analyze forms like a pro
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">🔐 Secure Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">Email/password authentication with NextAuth</p>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">🎨 Drag & Drop Builder</h3>
              <p className="text-sm text-gray-600 mb-4">Intuitive form builder with reorderable fields</p>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">☁️ File Uploads</h3>
              <p className="text-sm text-gray-600 mb-4">Image uploads with Cloudinary integration</p>
              <div className="text-xs text-green-600 font-medium">
                ✓ Up to 10MB per file
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-gray-900">📱 Responsive Design</h3>
              <p className="text-sm text-gray-600 mb-4">Works perfectly on desktop and mobile</p>
              <div className="text-xs text-blue-600 font-medium">
                ✓ Mobile optimized
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Data Collection?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who trust Form Creator for their data collection needs. 
            Start building your first form today – it's completely free!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Get Started Now - It's Free!
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold transition-all duration-300">
              <Link href="/auth/signin">
                Already have an account?
              </Link>
            </Button>
          </div>
          
          {/* <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>24/7 support</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}