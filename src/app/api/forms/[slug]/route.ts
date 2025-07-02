import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/FormResponse";

// GET - Fetch form by slug
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params
    // const session = await getServerSession(authOptions);

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    await dbConnect();

    const form = await Form.findOne({
      slug: params.slug,
      // userId: session.user.id,
    }).lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    const form = await Form.findOne({ slug: params.slug });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if already submitted by email
    let alreadySubmitted = false;
    if (form.settings.limitByEmail) {
      const existingResponse = await FormResponse.findOne({
        formId: form._id,
        "metadata.email": email,
      });
      if (existingResponse) {
        alreadySubmitted = true;
      }
    }

    return NextResponse.json({ alreadySubmitted });
  } catch (error) {
    console.error("Error checking submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongooseError } from "mongoose";



// PUT - Update form by slug
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, fields, settings } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Form title is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the form to update
    const existingForm = await Form.findOne({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Process and validate fields
    const processedFields = (fields || []).map((field: any, index: number) => ({
      id: field.id || `field-${Date.now()}-${index}`,
      type: field.type,
      label: field.label,
      required: field.required || false,
      placeholder: field.placeholder,
      description: field.description,
      options: field.options || [],
      allowMultiple: field.allowMultiple || false,
      allowOther: field.allowOther || false,
      maxRating: field.maxRating || 5,
      minScale: field.minScale || 1,
      maxScale: field.maxScale || 10,
      scaleLabels: field.scaleLabels || {},
      minValue: field.minValue,
      maxValue: field.maxValue,
      step: field.step || 1,
      minLength: field.minLength,
      maxLength: field.maxLength,
      pattern: field.pattern,
      minDate: field.minDate ? new Date(field.minDate) : undefined,
      maxDate: field.maxDate ? new Date(field.maxDate) : undefined,
      dateFormat: field.dateFormat || "MM/DD/YYYY",
      allowedFileTypes: field.allowedFileTypes || [],
      maxFileSize: field.maxFileSize || 10,
      maxFiles: field.maxFiles || 1,
      conditionalLogic: field.conditionalLogic,
      order: field.order !== undefined ? field.order : index,
      width: field.width || "full",
      validation: field.validation,
      // For assignment mode - store correct answers and points
      ...(settings?.assignmentMode && {
        correctAnswer: field.correctAnswer,
        explanation: field.explanation,
        points: field.points || 1,
      }),
    }));

    // Process settings with defaults and existing values
    const processedSettings = {
      isPublic:
        settings?.isPublic !== undefined
          ? settings.isPublic
          : existingForm.settings.isPublic,
      allowedEmails: Array.isArray(settings?.allowedEmails)
        ? settings.allowedEmails
        : existingForm.settings.allowedEmails || [],
      limitOneResponse:
        settings?.limitOneResponse !== undefined
          ? settings.limitOneResponse
          : existingForm.settings.limitOneResponse,
      limitByEmail:
        settings?.limitByEmail !== undefined
          ? settings.limitByEmail
          : existingForm.settings.limitByEmail,
      limitByIP:
        settings?.limitByIP !== undefined
          ? settings.limitByIP
          : existingForm.settings.limitByIP,
      openDate: settings?.openDate
        ? new Date(settings.openDate)
        : existingForm.settings.openDate,
      closeDate: settings?.closeDate
        ? new Date(settings.closeDate)
        : existingForm.settings.closeDate,
      assignmentMode:
        settings?.assignmentMode !== undefined
          ? settings.assignmentMode
          : existingForm.settings.assignmentMode,
      requireLogin:
        settings?.requireLogin !== undefined
          ? settings.requireLogin
          : existingForm.settings.requireAuth,
      allowAnonymous:
        settings?.allowAnonymous !== undefined
          ? settings.allowAnonymous
          : !existingForm.settings.requireAuth,
      collectEmail:
        settings?.collectEmail !== undefined
          ? settings.collectEmail
          : existingForm.settings.collectEmail,
      collectIP:
        settings?.collectIP !== undefined
          ? settings.collectIP
          : existingForm.settings.collectIP,
      collectLocation:
        settings?.collectLocation !== undefined
          ? settings.collectLocation
          : existingForm.settings.collectLocation,
      collectDeviceInfo:
        settings?.collectDeviceInfo !== undefined
          ? settings.collectDeviceInfo
          : existingForm.settings.collectDeviceInfo,
      allowDrafts:
        settings?.allowDrafts !== undefined
          ? settings.allowDrafts
          : existingForm.settings.allowDrafts,
      showProgressBar:
        settings?.showProgressBar !== undefined
          ? settings.showProgressBar
          : existingForm.settings.showProgressBar,
      allowSaveDraft:
        settings?.allowSaveDraft !== undefined
          ? settings.allowSaveDraft
          : existingForm.settings.allowDrafts,
      randomizeQuestions:
        settings?.randomizeQuestions !== undefined
          ? settings.randomizeQuestions
          : existingForm.settings.randomizeQuestions,
      timeLimit: settings?.timeLimit || existingForm.settings.timeLimit,
      passingScore:
        settings?.passingScore !== undefined
          ? settings.passingScore
          : existingForm.settings.passingScore,
      showCorrectAnswers:
        settings?.showCorrectAnswers !== undefined
          ? settings.showCorrectAnswers
          : existingForm.settings.showCorrectAnswers,
      allowRetakes:
        settings?.allowRetakes !== undefined
          ? settings.allowRetakes
          : existingForm.settings.allowRetakes,
      maxRetakes:
        settings?.maxRetakes !== undefined
          ? settings.maxRetakes
          : existingForm.settings.maxRetakes,
      customTheme: {
        primaryColor:
          settings?.customTheme?.primaryColor ||
          existingForm.settings.customTheme?.primaryColor,
        backgroundColor:
          settings?.customTheme?.backgroundColor ||
          existingForm.settings.customTheme?.backgroundColor,
        textColor:
          settings?.customTheme?.textColor ||
          existingForm.settings.customTheme?.textColor,
        fontFamily:
          settings?.customTheme?.fontFamily ||
          existingForm.settings.customTheme?.fontFamily,
      },
      notifications: {
        emailOnSubmission:
          settings?.notifications?.emailOnSubmission !== undefined
            ? settings.notifications.emailOnSubmission
            : existingForm.settings.notifications?.emailOnSubmission || false,
        notificationEmails: Array.isArray(
          settings?.notifications?.notificationEmails
        )
          ? settings.notifications.notificationEmails
          : existingForm.settings.notifications?.notificationEmails || [],
      },
      redirectUrl: settings?.redirectUrl || existingForm.settings.redirectUrl,
      customSuccessMessage:
        settings?.customSuccessMessage ||
        existingForm.settings.customSuccessMessage,
    };

    // Update the form
    const updatedForm = await Form.findByIdAndUpdate(
      existingForm._id,
      {
        title: title.trim(),
        description: description?.trim() || "",
        fields: processedFields,
        settings: processedSettings,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updatedForm) {
      return NextResponse.json(
        { error: "Failed to update form" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      form: updatedForm,
      message: "Form updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating form:", error);
    if (error instanceof Error || error instanceof MongooseError) {
      if (error.name === "ValidationError") {
        return NextResponse.json(
          {
            error: "Validation error",
            details: error.message,
            validationErrors: error.errors,
          },
          { status: 400 }
        );
      }

      // Handle cast errors (invalid ObjectId, etc.)
      if (error.name === "CastError") {
        return NextResponse.json(
          { error: "Invalid form data" },
          { status: 400 }
        );
      }
    }
    // Handle validation errors

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete form by slug
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

    // Find and delete the form
    const deletedForm = await Form.findOneAndDelete({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!deletedForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // TODO: Also delete associated form responses
    // const FormResponse = require("@/models/FormResponse");
    // await FormResponse.deleteMany({ formId: deletedForm._id });

    return NextResponse.json({
      message: "Form deleted successfully",
      deletedForm: {
        id: deletedForm._id,
        title: deletedForm.title,
        slug: deletedForm.slug,
      },
    });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
