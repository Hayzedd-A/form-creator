'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Calendar, Users, Clock, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import { formatDate, calculatePercentage } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts'
import { formatDuration } from '@/lib/analytics'

interface AnalyticsData {
  overview: {
    totalResponses: number
    completedResponses: number
    draftResponses: number
    partialResponses: number
    completionRate: number
    averageTime: number
  }
  trends: {
    responsesByDate: Array<{ date: string; responses: number }>
  }
  demographics: {
    devices: Array<{ device: string; count: number }>
    browsers: Array<{ browser: string; count: number }>
    operatingSystems: Array<{ os: string; count: number }>
    locations: Array<{ country: string; count: number }>
  }
  fieldAnalytics: Array<{
    fieldId: string
    label: string
    type: string
    responseCount: number
    responseRate: number
    valueDistribution?: Array<{ value: string; count: number; percentage: number }>
    average?: number
    min?: number
    max?: number
    correctRate?: number
  }>
  scoringAnalytics?: {
    averageScore: number
    highestScore: number
    lowestScore: number
    passingRate: number
    gradeDistribution: Array<{ grade: string; count: number; percentage: number }>
  }
  form: {
    title: string
    createdAt: string
    settings: any
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function FormAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchAnalytics();
  }, [session, status, router, slug, period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/forms/${slug}/analytics?period=${period}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: "csv" | "json") => {
    try {
      const response = await fetch(
        `/api/forms/${slug}/export?format=${format}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slug}-responses.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {analytics.form.title}
                </h1>
                <p className="text-gray-600">Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <Button variant="outline" onClick={() => exportData("csv")}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => exportData("json")}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Responses
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.overview.totalResponses}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.completedResponses} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.overview.completionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.draftResponses} drafts,{" "}
                {analytics.overview.partialResponses} partial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(analytics.overview.averageTime)}
              </div>
              <p className="text-xs text-muted-foreground">Time to complete</p>
            </CardContent>
          </Card>

          {analytics.scoringAnalytics && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Score
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.scoringAnalytics.averageScore}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.scoringAnalytics.passingRate}% passing rate
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Response Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Response Trends</CardTitle>
            <CardDescription>
              Daily response count over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trends.responsesByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                    formatter={(value) => [value, "Responses"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="responses"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
              <CardDescription>
                Distribution of devices used to submit responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analytics.demographics.devices}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device, count }) => `${device}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="device"
                    >
                      {analytics.demographics.devices.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Browser Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Browsers</CardTitle>
              <CardDescription>Most popular browsers used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.demographics.browsers.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Mode Analytics */}
        {analytics.scoringAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Distribution of grades received
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.scoringAnalytics.gradeDistribution}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Students"]} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Statistics</CardTitle>
                <CardDescription>Detailed scoring breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Average Score:</span>
                  <span className="text-sm">
                    {analytics.scoringAnalytics.averageScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Highest Score:</span>
                  <span className="text-sm">
                    {analytics.scoringAnalytics.highestScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Lowest Score:</span>
                  <span className="text-sm">
                    {analytics.scoringAnalytics.lowestScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Passing Rate:</span>
                  <span className="text-sm">
                    {analytics.scoringAnalytics.passingRate}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Field Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Field Performance</CardTitle>
            <CardDescription>
              Response rates and performance for each field
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics.fieldAnalytics.map((field) => (
                <div key={field.fieldId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{field.label}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {field.type.replace("-", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {field.responseRate}% response rate
                      </div>
                      <div className="text-xs text-gray-600">
                        {field.responseCount} responses
                      </div>
                    </div>
                  </div>

                  {/* Multiple Choice / Dropdown Distribution */}
                  {field.valueDistribution && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">
                        Response Distribution
                      </h5>
                      <div className="space-y-2">
                        {field.valueDistribution
                          .slice(0, 5)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm truncate flex-1 mr-2">
                                {item.value}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 w-12 text-right">
                                  {item.count} ({item.percentage}%)
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Numeric Field Statistics */}
                  {field.average !== undefined && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Average:</span>
                        <div className="font-medium">{field.average}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Min:</span>
                        <div className="font-medium">{field.min}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Max:</span>
                        <div className="font-medium">{field.max}</div>
                      </div>
                    </div>
                  )}

                  {/* Assignment Mode Correct Rate */}
                  {field.correctRate !== undefined && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Correct Rate:
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            field.correctRate >= 70
                              ? "text-green-600"
                              : field.correctRate >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {field.correctRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            field.correctRate >= 70
                              ? "bg-green-600"
                              : field.correctRate >= 50
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                          style={{ width: `${field.correctRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        {analytics.demographics.locations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Responses by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.demographics.locations
                  .slice(0, 6)
                  .map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{location.country}</span>
                      <span className="text-sm text-gray-600">
                        {location.count} responses
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

