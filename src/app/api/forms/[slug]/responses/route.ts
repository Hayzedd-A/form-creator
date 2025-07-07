import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/FormResponse";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // First, verify the form belongs to the user
    const form = await Form.findOne({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const status = searchParams.get("status");
    const dateFilter = searchParams.get("dateFilter");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "newest";

    // Build filter query
    const filterQuery: any = { formId: form._id };

    // Status filter
    if (status && status !== "all") {
      filterQuery.status = status;
    }

    // Date filter
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filterQuery.createdAt = { $gte: filterDate };
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filterQuery.createdAt = { $gte: filterDate };
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filterQuery.createdAt = { $gte: filterDate };
          break;
      }
    }

    // Search filter
    if (search) {
      filterQuery.$or = [
        { submitterEmail: { $regex: search, $options: "i" } },
        { submitterIp: { $regex: search, $options: "i" } },
        { "responses.value": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort query
    let sortQuery: any = {};
    switch (sortBy) {
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "oldest":
        sortQuery = { createdAt: 1 };
        break;
      case "score":
        sortQuery = { totalScore: -1 };
        break;
      case "email":
        sortQuery = { submitterEmail: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Get total count for pagination
    const totalCount = await FormResponse.countDocuments(filterQuery);

    // Fetch responses with pagination
    const responses = await FormResponse.find(filterQuery)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate analytics
    const analytics = await calculateAnalytics(form._id.toString(), form);

    // Calculate field analytics
    const fieldAnalytics = await calculateFieldAnalytics(form._id.toString(), form.fields);

    return NextResponse.json({
      responses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
      analytics: {
        ...analytics,
        fieldAnalytics,
      },
    });
  } catch (error) {
    console.error("Error fetching form responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
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
    const responseIds = searchParams.get("ids")?.split(",") || [];

    if (responseIds.length === 0) {
      return NextResponse.json(
        { error: "No response IDs provided" },
        { status: 400 }
      );
    }

    // Delete multiple responses
    const result = await FormResponse.deleteMany({
      _id: { $in: responseIds },
      formId: form._id,
    });

    return NextResponse.json({
      message: `${result.deletedCount} responses deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting form responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function calculateAnalytics(formId: string, form: any) {
  const allResponses = await FormResponse.find({ formId }).lean();

  const totalResponses = allResponses.length;
  const completedResponses = allResponses.filter(
    (r) => r.status === "completed"
  ).length;
  const draftResponses = allResponses.filter(
    (r) => r.status === "draft"
  ).length;
  const partialResponses = allResponses.filter(
    (r) => r.status === "partial"
  ).length;

  // Calculate average score for assignment mode
  let averageScore: number | undefined;
  if (form.settings?.assignmentMode) {
    const scoredResponses = allResponses.filter(
      (r) => r.totalScore !== undefined
    );
    if (scoredResponses.length > 0) {
      averageScore =
        scoredResponses.reduce((sum, r) => sum + (r.totalScore || 0), 0) /
        scoredResponses.length;
    }
  }

  // Calculate average time spent
  const responsesWithTime = allResponses.filter((r) => r.timeSpent);
  const averageTime =
    responsesWithTime.length > 0
      ? responsesWithTime.reduce((sum, r) => sum + (r.timeSpent || 0), 0) /
        responsesWithTime.length
      : undefined;

  // Group responses by date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentResponses = allResponses.filter(
    (r) => new Date(r.createdAt) >= thirtyDaysAgo
  );
  const responsesByDate = recentResponses.reduce((acc, response) => {
    const date = new Date(response.createdAt).toISOString().split("T")[0];
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, [] as Array<{ date: string; count: number }>);

  // Group responses by location
  const responsesByLocation = allResponses.reduce((acc, response) => {
    const location = response.submitterLocation?.country || "Unknown";
    const existing = acc.find((item) => item.location === location);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ location, count: 1 });
    }
    return acc;
  }, [] as Array<{ location: string; count: number }>);

  // Group responses by device/browser
  const responsesByBrowser = allResponses.reduce((acc, response) => {
    const browser = response.deviceInfo?.browser || "Unknown";
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const responsesByOS = allResponses.reduce((acc, response) => {
    const os = response.deviceInfo?.os || "Unknown";
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate completion rate
  const completionRate =
    totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

  // Calculate score distribution for assignment mode
  let scoreDistribution: Record<string, number> | undefined;
  if (form.settings?.assignmentMode) {
    scoreDistribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    allResponses.forEach((response) => {
      if (response.totalScore !== undefined && response.maxScore) {
        const percentage = (response.totalScore / response.maxScore) * 100;
        if (percentage >= 90) scoreDistribution!["A"]++;
        else if (percentage >= 80) scoreDistribution!["B"]++;
        else if (percentage >= 70) scoreDistribution!["C"]++;
        else if (percentage >= 60) scoreDistribution!["D"]++;
        else scoreDistribution!["F"]++;
      }
    });
  }

  return {
    totalResponses,
    completedResponses,
    draftResponses,
    partialResponses,
    averageScore,
    averageTime,
    completionRate,
    responsesByDate: responsesByDate.sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    responsesByLocation: responsesByLocation.sort((a, b) => b.count - a.count),
    responsesByBrowser,
    responsesByOS,
    scoreDistribution,
  };
}

async function calculateFieldAnalytics(formId: string, fields: any[]) {
  const allResponses = await FormResponse.find({ formId }).lean();
  console.log(allResponses)
  return fields.map((field) => {
    const fieldResponses = allResponses
      .map((r) => r.responses?.find((resp: any) => resp.fieldId === field.id))
      .filter(Boolean);

    const responseCount = fieldResponses.length;
    let averageValue: number | undefined;
    let mostCommonAnswer: string | undefined;
    let correctRate: number | undefined;

    // Calculate average for numeric fields
    if (["rating", "linear-scale", "number"].includes(field.type)) {
      const values = fieldResponses
        .map((r: any) => Number(r?.value))
        .filter((v) => !isNaN(v));
      averageValue =
        values.length > 0
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : undefined;
    }

    // Find most common answer for choice fields
    if (
      ["multiple-choice", "dropdown", "yes-no", "checkbox"].includes(field.type)
    ) {
      const valueCounts = fieldResponses.reduce((acc, r: any) => {
        const value = Array.isArray(r?.value)
          ? r.value.join(", ")
          : String(r?.value || "");
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      mostCommonAnswer = Object.entries(valueCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];
    }

    // Calculate correct rate for assignment mode
    if (field.correctAnswer !== undefined) {
      const correctResponses = fieldResponses.filter(
        (r: any) => r?.isCorrect
      ).length;
      correctRate =
        responseCount > 0 ? (correctResponses / responseCount) * 100 : 0;
    }

    // Calculate response rate
    const responseRate =
      allResponses.length > 0 ? (responseCount / allResponses.length) * 100 : 0;

    // Get value distribution for choice fields
    let valueDistribution: Record<string, number> | undefined;
    if (
      ["multiple-choice", "dropdown", "yes-no", "checkbox"].includes(field.type)
    ) {
      valueDistribution = fieldResponses.reduce((acc, r: any) => {
        const value = Array.isArray(r?.value) ? r.value : [r?.value];
        value.forEach((v: any) => {
          if (v) {
            acc[String(v)] = (acc[String(v)] || 0) + 1;
          }
        });
        return acc;
      }, {} as Record<string, number>);
    }

    return {
      fieldId: field.id,
      fieldLabel: field.label,
      fieldType: field.type,
      responseCount,
      responseRate,
      averageValue,
      mostCommonAnswer,
      correctRate,
      valueDistribution,
      // Additional metrics
      requiredFieldSkipRate:
        field.required && allResponses.length > 0
          ? ((allResponses.length - responseCount) / allResponses.length) * 100
          : undefined,
    };
  });
}
