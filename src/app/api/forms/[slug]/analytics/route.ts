import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/FormResponse";

// Define types for analytics
interface BaseFieldAnalytics {
  fieldId: string;
  label: string;
  type: string;
  responseCount: number;
  responseRate: number;
  valueDistribution?: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;
  average?: number;
  min?: number;
  max?: number;
  correctRate?: number;
}

interface ScoringAnalytics {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passingRate: number;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Verify the form belongs to the user
    const form = await Form.findOne({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Fetch responses in the period
    const responses = await FormResponse.find({
      formId: form._id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Calculate basic metrics
    const totalResponses = responses.length;
    const completedResponses = responses.filter(
      (r) => r.status === "completed"
    ).length;
    const draftResponses = responses.filter((r) => r.status === "draft").length;
    const partialResponses = responses.filter(
      (r) => r.status === "partial"
    ).length;

    // Calculate completion rate
    const completionRate =
      totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    // Calculate average time spent
    const responsesWithTime = responses.filter(
      (r) => r.timeSpent && r.timeSpent > 0
    );
    const averageTime =
      responsesWithTime.length > 0
        ? responsesWithTime.reduce((sum, r) => sum + (r.timeSpent || 0), 0) /
          responsesWithTime.length
        : 0;

    // Group responses by date
    const responsesByDate = responses.reduce((acc, response) => {
      const date = new Date(response.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fill in missing dates with 0
    const dateRange: Array<{ date: string; responses: number }> = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      dateRange.push({
        date: dateStr,
        responses: responsesByDate[dateStr] || 0,
      });
    }

    // Device analytics
    const deviceStats = responses.reduce(
      (acc, response) => {
        if (response.deviceInfo) {
          const device = response.deviceInfo.device || "Unknown";
          const browser = response.deviceInfo.browser || "Unknown";
          const os = response.deviceInfo.os || "Unknown";

          acc.devices[device] = (acc.devices[device] || 0) + 1;
          acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
          acc.operatingSystems[os] = (acc.operatingSystems[os] || 0) + 1;
        }
        return acc;
      },
      {
        devices: {} as Record<string, number>,
        browsers: {} as Record<string, number>,
        operatingSystems: {} as Record<string, number>,
      }
    );

    // Location analytics
    const locationStats = responses.reduce((acc, response) => {
      if (response.submitterLocation?.country) {
        const country = response.submitterLocation.country;
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Field analytics
    const fieldAnalytics: BaseFieldAnalytics[] = form.fields.map(
      (field: any) => {
        const fieldResponses = responses
          .map((r) =>
            r.responses.find((resp: any) => resp.fieldId === field.id)
          )
          .filter(Boolean);

        const responseCount = fieldResponses.length;
        const responseRate =
          totalResponses > 0 ? (responseCount / totalResponses) * 100 : 0;

        const analytics: BaseFieldAnalytics = {
          fieldId: field.id,
          label: field.label,
          type: field.type,
          responseCount,
          responseRate: Math.round(responseRate),
        };

        // Type-specific analytics for choice-based fields
        if (
          ["multiple-choice", "dropdown", "checkbox", "yes-no"].includes(
            field.type
          )
        ) {
          const valueDistribution = fieldResponses.reduce(
            (acc, response: any) => {
              const values = Array.isArray(response.value)
                ? response.value
                : [response.value];
              values.forEach((value: any) => {
                if (value) {
                  acc[String(value)] = (acc[String(value)] || 0) + 1;
                }
              });
              return acc;
            },
            {} as Record<string, number>
          );

          analytics.valueDistribution = Object.entries(valueDistribution)
            .map(([value, count]) => ({
              value,
              count,
              percentage:
                responseCount > 0
                  ? Math.round((count / responseCount) * 100)
                  : 0,
            }))
            .sort((a, b) => b.count - a.count);
        }

        // Type-specific analytics for numeric fields
        if (["rating", "linear-scale", "number"].includes(field.type)) {
          const values = fieldResponses
            .map((r: any) => Number(r.value))
            .filter((v) => !isNaN(v));

          if (values.length > 0) {
            analytics.average =
              Math.round(
                (values.reduce((sum, v) => sum + v, 0) / values.length) * 100
              ) / 100;
            analytics.min = Math.min(...values);
            analytics.max = Math.max(...values);
          }
        }

        // Assignment mode analytics
        if (form.settings.assignmentMode && field.correctAnswer !== undefined) {
          const correctResponses = fieldResponses.filter(
            (r: any) => r.isCorrect
          ).length;
          analytics.correctRate =
            responseCount > 0
              ? Math.round((correctResponses / responseCount) * 100)
              : 0;
        }

        return analytics;
      }
    );

    // Assignment mode scoring analytics
    let scoringAnalytics: ScoringAnalytics | null = null;
    if (form.settings.assignmentMode) {
      const scoredResponses = responses.filter(
        (r) => r.totalScore !== undefined && r.maxScore !== undefined
      );

      if (scoredResponses.length > 0) {
        const scores = scoredResponses.map(
          (r) => (r.totalScore! / r.maxScore!) * 100
        );
        const averageScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;

        const gradeDistribution = scoredResponses.reduce((acc, response) => {
          const percentage = (response.totalScore! / response.maxScore!) * 100;
          let grade = "F";
          if (percentage >= 90) grade = "A";
          else if (percentage >= 80) grade = "B";
          else if (percentage >= 70) grade = "C";
          else if (percentage >= 60) grade = "D";

          acc[grade] = (acc[grade] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        scoringAnalytics = {
          averageScore: Math.round(averageScore * 100) / 100,
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores),
          passingRate: Math.round(
            (scores.filter((s) => s >= (form.settings.passingScore || 70))
              .length /
              scores.length) *
              100
          ),
          gradeDistribution: Object.entries(gradeDistribution).map(
            ([grade, count]) => ({
              grade,
              count,
              percentage: Math.round((count / scoredResponses.length) * 100),
            })
          ),
        };
      }
    }

    return NextResponse.json({
      overview: {
        totalResponses,
        completedResponses,
        draftResponses,
        partialResponses,
        completionRate: Math.round(completionRate),
        averageTime: Math.round(averageTime),
      },
      trends: {
        responsesByDate: dateRange,
      },
      demographics: {
        devices: Object.entries(deviceStats.devices).map(([device, count]) => ({
          device,
          count,
        })),
        browsers: Object.entries(deviceStats.browsers).map(
          ([browser, count]) => ({ browser, count })
        ),
        operatingSystems: Object.entries(deviceStats.operatingSystems).map(
          ([os, count]) => ({ os, count })
        ),
        locations: Object.entries(locationStats).map(([country, count]) => ({
          country,
          count,
        })),
      },
      fieldAnalytics,
      scoringAnalytics,
      form: {
        title: form.title,
        createdAt: form.createdAt,
        settings: form.settings,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
