// import { NextRequest, NextResponse } from 'next/server'
// import dbConnect from '@/lib/mongodb'
// import Form from '@/models/Form'
// import FormResponse from '@/models/FormResponse'

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { slug: string } }
// ) {
//   try {
//     await dbConnect()

//     const form = await Form.findOne({ slug: params.slug })

//     if (!form) {
//       return NextResponse.json(
//         { error: 'Form not found' },
//         { status: 404 }
//       )
//     }

//     // Check if form is public
//     if (!form.settings.isPublic) {
//       return NextResponse.json(
//         { error: 'Form is not public' },
//         { status: 403 }
//       )
//     }

//     // Check if form is within open/close dates
//     const now = new Date()
//     if (form.settings.openDate && new Date(form.settings.openDate) > now) {
//       return NextResponse.json(
//         { error: 'Form is not yet open' },
//         { status: 403 }
//       )
//     }

//     if (form.settings.closeDate && new Date(form.settings.closeDate) < now) {
//       return NextResponse.json(
//         { error: 'Form is closed' },
//         { status: 403 }
//       )
//     }

//     const body = await request.json()
//     const { responses } = body

//     // Get client IP
//     const forwarded = request.headers.get('x-forwarded-for')
//     const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

//     // Check for duplicate submissions if enabled
//     if (form.settings.limitOneResponse) {
//       const existingResponse = await FormResponse.findOne({
//         formId: form._id,
//         submitterIp: ip
//       })

//       if (existingResponse) {
//         return NextResponse.json(
//           { error: 'You have already submitted a response to this form' },
//           { status: 400 }
//         )
//       }
//     }

//     // Validate required fields
//     const requiredFields = form.fields.filter(field => field.required)
//     const missingFields = requiredFields.filter(field => !responses[field.id])

//     if (missingFields.length > 0) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       )
//     }

//     // Process responses
//     const processedResponses = form.fields.map(field => {
//       const value = responses[field.id]

//       // Handle file uploads (for now, just store the filename)
//       if (field.type === 'file-upload' && value) {
//         // In a real app, you'd upload to Cloudinary here
//         return {
//           fieldId: field.id,
//           value: 'file-placeholder.jpg', // This would be the actual file URL
//           fileUrl: 'https://example.com/file-placeholder.jpg'
//         }
//       }

//       return {
//         fieldId: field.id,
//         value: value || ''
//       }
//     }).filter(response => response.value !== '')

//     // Create form response
//     const formResponse = await FormResponse.create({
//       formId: form._id,
//       responses: processedResponses,
//       submitterIp: ip,
//     })

//     return NextResponse.json(
//       { message: 'Form submitted successfully', responseId: formResponse._id },
//       { status: 201 }
//     )
//   } catch (error) {
//     console.error('Error submitting form:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }
import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/dbConnect";
import Form from "@/models/Form";
import FormResponse from "@/models/FormResponse";
import {
  getClientIP,
  getDeviceInfo,
  getLocationInfo,
  validateFormAccess,
  calculateScore,
  getGradeFromScore,
  generateSessionId,
} from "@/lib/analytics";
import dbConnect from "@/lib/mongodb";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    await dbConnect();

    const form = await Form.findOne({ slug: params.slug }).lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const body = await request.json();
    const { responses, email, startTime, sessionId } = body;

    console.log("Received responses:", responses);

    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const deviceInfo = getDeviceInfo(userAgent);
    const referrer = request.headers.get("referer");

    // Validate form access
    const accessCheck = validateFormAccess(form, email, clientIP);
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
    }

    // Check for existing responses if limited
    if (form.settings.limitOneResponse || form.settings.limitByEmail) {
      const existingQuery: any = { formId: form._id };

      if (form.settings.limitByEmail && email) {
        existingQuery.submitterEmail = email;
      } else if (form.settings.limitOneResponse) {
        existingQuery.submitterIp = clientIP;
      }

      const existingResponse = await FormResponse.findOne(existingQuery);
      if (existingResponse) {
        return NextResponse.json(
          { error: "You have already submitted a response to this form" },
          { status: 409 }
        );
      }
    }

    // Get location info if enabled
    let locationInfo = null;
    if (form.settings.collectLocation) {
      locationInfo = await getLocationInfo(clientIP);
    }

    // Calculate timing
    const completedAt = new Date();
    const startedAt = startTime ? new Date(startTime) : completedAt;
    const timeSpent = Math.floor(
      (completedAt.getTime() - startedAt.getTime()) / 1000
    );

    // Transform responses object to array format expected by MongoDB
    const formattedResponses = [];

    if (responses && typeof responses === "object") {
      for (const [fieldId, value] of Object.entries(responses)) {
        // Skip empty values and "other" fields (they're handled separately)
        if (fieldId.endsWith("_other")) continue;
        if (value === null || value === undefined || value === "") continue;
        if (Array.isArray(value) && value.length === 0) continue;

        const field = form.fields.find((f: any) => f.id === fieldId);
        if (!field) continue; // Skip if field doesn't exist in form

        let processedValue = value;

        // Handle "other" option for multiple choice fields
        const otherValue = responses[`${fieldId}_other`];
        if (otherValue) {
          if (Array.isArray(processedValue)) {
            // Replace __other__ with actual other value
            processedValue = processedValue.map((v) =>
              v === "__other__" ? otherValue : v
            );
          } else if (processedValue === "__other__") {
            processedValue = otherValue;
          }
        }

        // Handle file uploads (store file names for now)
        if (field.type === "file-upload" && value) {
          if (Array.isArray(value)) {
            processedValue = value
              .map((f) => f.name || f.toString())
              .join(", ");
          } else {
            processedValue = value.name || value.toString();
          }
        }

        formattedResponses.push({
          fieldId: fieldId,
          value: processedValue,
          fileUrl: undefined, // Will be implemented when file upload is added
          isCorrect: undefined, // Will be set if assignment mode
        });
      }
    }

    console.log("Formatted responses:", formattedResponses);

    // Validate that we have responses
    if (formattedResponses.length === 0) {
      return NextResponse.json(
        { error: "No valid responses provided" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = form.fields.filter((field: any) => field.required);
    const missingFields = requiredFields.filter(
      (field: any) =>
        !formattedResponses.some((response) => response.fieldId === field.id)
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields: missingFields.map((f: any) => f.label),
        },
        { status: 400 }
      );
    }

    // Calculate score for assignment mode
    let scoring = null;
    let assignmentResults: any[] = [];

    if (form.settings.assignmentMode) {
      scoring = calculateScore(formattedResponses, form.fields);

      // Update responses with correct/incorrect flags and prepare results
      formattedResponses.forEach((response) => {
        const fieldScore = scoring!.fieldScores.find(
          (fs) => fs.fieldId === response.fieldId
        );
        if (fieldScore) {
          response.isCorrect = fieldScore.isCorrect;
        }
      });

      // Prepare assignment results for frontend
      assignmentResults = form.fields
        .filter((field: any) => field.correctAnswer !== undefined)
        .map((field: any) => {
          const response = formattedResponses.find(
            (r) => r.fieldId === field.id
          );
          const fieldScore = scoring!.fieldScores.find(
            (fs) => fs.fieldId === field.id
          );

          return {
            fieldId: field.id,
            userAnswer: response ? response.value : null,
            correctAnswer: field.correctAnswer,
            isCorrect: fieldScore ? fieldScore.isCorrect : false,
            explanation: field.explanation,
          };
        });
    }

    // Create the response document
    const responseData = {
      formId: form._id,
      responses: formattedResponses,
      submitterEmail: form.settings.collectEmail ? email : undefined,
      submitterIp: clientIP,
      submitterLocation: locationInfo,
      deviceInfo: form.settings.collectDeviceInfo ? deviceInfo : undefined,
      status: "completed" as const,
      timeSpent,
      startedAt,
      completedAt,
      totalScore: scoring?.totalScore,
      maxScore: scoring?.maxScore,
      referrer,
      sessionId: sessionId || generateSessionId(),
    };

    console.log(
      "Creating FormResponse with data:",
      JSON.stringify(responseData, null, 2)
    );

    const formResponse = await FormResponse.create(responseData);

    // Prepare response payload
    const responsePayload: any = {
      message: "Form submitted successfully",
      responseId: formResponse._id,
    };

    // Add assignment results for assignment mode
    if (form.settings.assignmentMode && assignmentResults.length > 0) {
      responsePayload.results = assignmentResults;

      if (scoring) {
        const gradeInfo = getGradeFromScore(
          scoring.totalScore,
          scoring.maxScore
        );

        responsePayload.scoring = {
          totalScore: scoring.totalScore,
          maxScore: scoring.maxScore,
          percentage: gradeInfo.percentage,
          grade: gradeInfo.letter,
          passed: gradeInfo.passed,
        };
      }
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    console.error("Error submitting form:", error);

    // Handle MongoDB validation errors specifically
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
          receivedData: body,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Handle draft saving
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();

    const form = await Form.findOne({ slug: params.slug }).lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if drafts are allowed
    if (!form.settings.allowDrafts) {
      return NextResponse.json(
        { error: "Draft saving is not enabled for this form" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { responses, email, sessionId, responseId } = body;

    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const deviceInfo = getDeviceInfo(userAgent);

    // Transform responses to proper format
    const formattedResponses = [];
    if (responses && typeof responses === "object") {
      for (const [fieldId, value] of Object.entries(responses)) {
        if (fieldId.endsWith("_other")) continue;
        if (value === null || value === undefined || value === "") continue;

        formattedResponses.push({
          fieldId: fieldId,
          value: value,
          fileUrl: undefined,
          isCorrect: undefined,
        });
      }
    }

    let formResponse;

    if (responseId) {
      // Update existing draft
      formResponse = await FormResponse.findOneAndUpdate(
        {
          _id: responseId,
          formId: form._id,
          status: { $in: ["draft", "partial"] },
        },
        {
          responses: formattedResponses,
          submitterEmail: form.settings.collectEmail ? email : undefined,
          deviceInfo: form.settings.collectDeviceInfo ? deviceInfo : undefined,
          status: "draft",
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Create new draft
      formResponse = await FormResponse.create({
        formId: form._id,
        responses: formattedResponses,
        submitterEmail: form.settings.collectEmail ? email : undefined,
        submitterIp: clientIP,
        deviceInfo: form.settings.collectDeviceInfo ? deviceInfo : undefined,
        status: "draft",
        sessionId: sessionId || generateSessionId(),
        startedAt: new Date(),
      });
    }

    if (!formResponse) {
      return NextResponse.json(
        { error: "Failed to save draft" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Draft saved successfully",
      responseId: formResponse._id,
      sessionId: formResponse.sessionId,
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
