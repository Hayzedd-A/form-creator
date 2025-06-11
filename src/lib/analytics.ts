import { NextRequest } from "next/server";

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  userAgent?: string;
}

export interface LocationInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function getDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // Detect OS
  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  // Detect device type
  let device = "Desktop";
  if (ua.includes("mobile")) device = "Mobile";
  else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";

  return {
    browser,
    os,
    device,
    userAgent,
  };
}

export async function getLocationInfo(
  ip: string
): Promise<LocationInfo | null> {
  try {
    // Skip localhost/private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return null;
    }

    // Use a free IP geolocation service
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,lat,lon`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country,
        city: data.city,
        region: data.regionName,
        timezone: data.timezone,
        coordinates: {
          lat: data.lat,
          lng: data.lon,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching location info:", error);
    return null;
  }
}

export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.ip || "127.0.0.1";
}

export function calculateResponseTime(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateFormAccess(
  form: any,
  userEmail?: string,
  userIP?: string
): {
  allowed: boolean;
  reason?: string;
} {
  const now = new Date();

  // Check if form is active
  if (!form.isActive) {
    return { allowed: false, reason: "Form is not active" };
  }

  // Check if form is public
  if (!form.settings.isPublic) {
    return { allowed: false, reason: "Form is not public" };
  }

  // Check open/close dates
  if (form.settings.openDate && now < new Date(form.settings.openDate)) {
    return { allowed: false, reason: "Form is not yet open" };
  }

  if (form.settings.closeDate && now > new Date(form.settings.closeDate)) {
    return { allowed: false, reason: "Form has closed" };
  }

  // Check email restrictions
  if (form.settings.allowedEmails?.length > 0) {
    if (!userEmail) {
      return { allowed: false, reason: "Email required for this form" };
    }

    const emailAllowed = form.settings.allowedEmails.some(
      (allowedEmail: string) => {
        if (allowedEmail.includes("*")) {
          // Handle wildcard domains like *@company.com
          const domain = allowedEmail.replace("*@", "");
          return userEmail.endsWith(`@${domain}`);
        }
        return userEmail === allowedEmail;
      }
    );

    if (!emailAllowed) {
      return {
        allowed: false,
        reason: "Your email is not authorized for this form",
      };
    }
  }

  return { allowed: true };
}

export function calculateScore(
  responses: any[],
  fields: any[]
): {
  totalScore: number;
  maxScore: number;
  fieldScores: Array<{
    fieldId: string;
    score: number;
    maxScore: number;
    isCorrect: boolean;
  }>;
} {
  let totalScore = 0;
  let maxScore = 0;
  const fieldScores: Array<{
    fieldId: string;
    score: number;
    maxScore: number;
    isCorrect: boolean;
  }> = [];

  fields.forEach((field) => {
    if (field.correctAnswer !== undefined) {
      const response = responses.find((r) => r.fieldId === field.id);
      const points = field.points || 1;
      maxScore += points;

      let isCorrect = false;
      let score = 0;

      if (response) {
        // Handle different field types
        switch (field.type) {
          case "multiple-choice":
          case "dropdown":
          case "yes-no":
            isCorrect = response.value === field.correctAnswer;
            break;

          case "checkbox":
            // For checkboxes, compare arrays
            const responseArray = Array.isArray(response.value)
              ? response.value
              : [response.value];
            const correctArray = Array.isArray(field.correctAnswer)
              ? field.correctAnswer
              : [field.correctAnswer];
            isCorrect =
              responseArray.length === correctArray.length &&
              responseArray.every((val: any) => correctArray.includes(val));
            break;

          case "short-text":
          case "paragraph":
            // Case-insensitive string comparison
            isCorrect =
              response.value?.toLowerCase().trim() ===
              field.correctAnswer?.toLowerCase().trim();
            break;

          case "number":
          case "rating":
          case "linear-scale":
            isCorrect = Number(response.value) === Number(field.correctAnswer);
            break;

          default:
            isCorrect = response.value === field.correctAnswer;
        }

        score = isCorrect ? points : 0;
        totalScore += score;
      }

      fieldScores.push({
        fieldId: field.id,
        score,
        maxScore: points,
        isCorrect,
      });
    }
  });

  return { totalScore, maxScore, fieldScores };
}

export function getGradeFromScore(
  score: number,
  maxScore: number
): {
  percentage: number;
  letter: string;
  passed: boolean;
} {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  let letter = "F";
  if (percentage >= 90) letter = "A";
  else if (percentage >= 80) letter = "B";
  else if (percentage >= 70) letter = "C";
  else if (percentage >= 60) letter = "D";

  return {
    percentage,
    letter,
    passed: percentage >= 70, // Default passing score
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function exportToCSV(
  responses: any[],
  fields: any[],
  formTitle: string
): string {
  // Create headers
  const headers = [
    "Submission Date",
    "Status",
    "Email",
    "IP Address",
    "Location",
    "Device",
    "Browser",
    "Time Spent",
    ...(fields.some((f: any) => f.correctAnswer !== undefined)
      ? ["Score", "Grade"]
      : []),
    ...fields.map((field: any) => field.label),
  ];

  // Create rows
  const rows = responses.map((response) => {
    const row = [
      new Date(response.createdAt).toLocaleString(),
      response.status || "completed",
      response.submitterEmail || "",
      response.submitterIp || "",
      response.submitterLocation?.city ||
        response.submitterLocation?.country ||
        "",
      response.deviceInfo?.device || "",
      response.deviceInfo?.browser || "",
      response.timeSpent ? formatDuration(response.timeSpent) : "",
    ];

    // Add score and grade if assignment mode
    if (fields.some((f: any) => f.correctAnswer !== undefined)) {
      const scoreText =
        response.totalScore !== undefined && response.maxScore !== undefined
          ? `${response.totalScore}/${response.maxScore}`
          : "";
      const gradeText =
        response.totalScore !== undefined && response.maxScore !== undefined
          ? getGradeFromScore(response.totalScore, response.maxScore).letter
          : "";

      row.push(scoreText, gradeText);
    }

    // Add field values
    fields.forEach((field: any) => {
      const fieldResponse = response.responses.find(
        (r: any) => r.fieldId === field.id
      );
      let value = fieldResponse?.value || "";

      // Handle arrays (multiple choice, checkboxes)
      if (Array.isArray(value)) {
        value = value.join("; ");
      }

      // Handle file uploads
      if (field.type === "file-upload" && fieldResponse?.fileUrl) {
        value = fieldResponse.fileUrl;
      }

      row.push(String(value));
    });

    return row;
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return csvContent;
}

export function exportToJSON(responses: any[], form: any): string {
  const exportData = {
    form: {
      title: form.title,
      description: form.description,
      slug: form.slug,
      fields: form.fields,
      settings: form.settings,
      exportedAt: new Date().toISOString(),
    },
    responses: responses.map((response) => ({
      id: response._id,
      submittedAt: response.createdAt,
      status: response.status,
      submitter: {
        email: response.submitterEmail,
        ip: response.submitterIp,
        location: response.submitterLocation,
        device: response.deviceInfo,
      },
      timing: {
        timeSpent: response.timeSpent,
        startedAt: response.startedAt,
        completedAt: response.completedAt,
      },
      scoring:
        response.totalScore !== undefined
          ? {
              totalScore: response.totalScore,
              maxScore: response.maxScore,
              percentage:
                response.maxScore > 0
                  ? Math.round((response.totalScore / response.maxScore) * 100)
                  : 0,
              grade:
                response.maxScore > 0
                  ? getGradeFromScore(response.totalScore, response.maxScore)
                      .letter
                  : null,
            }
          : undefined,
      responses: response.responses,
    })),
    summary: {
      totalResponses: responses.length,
      completedResponses: responses.filter((r: any) => r.status === "completed")
        .length,
      averageScore: form.settings.assignmentMode
        ? responses.reduce(
            (sum: number, r: any) => sum + (r.totalScore || 0),
            0
          ) / responses.length
        : undefined,
      averageTime:
        responses.reduce((sum: number, r: any) => sum + (r.timeSpent || 0), 0) /
        responses.length,
    },
  };

  return JSON.stringify(exportData, null, 2);
}
