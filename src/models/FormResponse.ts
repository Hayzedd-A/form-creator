import mongoose, { Document, Schema, Model } from "mongoose";

export interface IFormResponseField {
  fieldId: string;
  value: any;
  fileUrl?: string;
  isCorrect?: boolean;
}

export interface IDeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  userAgent?: string;
}

export interface ILocationInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IFormResponse extends Document {
  formId: mongoose.Types.ObjectId;
  responses: IFormResponseField[];
  submitterEmail?: string;
  submitterIp: string;
  submitterLocation?: ILocationInfo;
  deviceInfo?: IDeviceInfo;
  status: "draft" | "partial" | "completed";
  timeSpent?: number; // in seconds
  startedAt?: Date;
  completedAt?: Date;
  totalScore?: number;
  maxScore?: number;
  manualGrade?: number;
  adminNotes?: string;
  referrer?: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FormResponseFieldSchema = new Schema<IFormResponseField>({
  fieldId: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  fileUrl: { type: String },
  isCorrect: { type: Boolean },
});

const DeviceInfoSchema = new Schema<IDeviceInfo>({
  browser: { type: String },
  os: { type: String },
  device: { type: String },
  userAgent: { type: String },
});

const LocationInfoSchema = new Schema<ILocationInfo>({
  country: { type: String },
  city: { type: String },
  region: { type: String },
  timezone: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
});

const FormResponseSchema = new Schema<IFormResponse>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    responses: [FormResponseFieldSchema],
    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    submitterIp: {
      type: String,
      required: true,
    },
    submitterLocation: LocationInfoSchema,
    deviceInfo: DeviceInfoSchema,
    status: {
      type: String,
      enum: ["draft", "partial", "completed"],
      default: "completed",
    },
    timeSpent: { type: Number }, // in seconds
    startedAt: { type: Date },
    completedAt: { type: Date },
    totalScore: { type: Number },
    maxScore: { type: Number },
    manualGrade: { type: Number },
    adminNotes: { type: String },
    referrer: { type: String },
    sessionId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
FormResponseSchema.index({ formId: 1, createdAt: -1 });
FormResponseSchema.index({ formId: 1, status: 1 });
FormResponseSchema.index({ formId: 1, submitterEmail: 1 });
FormResponseSchema.index({ formId: 1, submitterIp: 1 });
FormResponseSchema.index({ formId: 1, totalScore: -1 });

const FormResponse: Model<IFormResponse> =  mongoose.models.FormResponse || mongoose.model<IFormResponse>("FormResponse", FormResponseSchema);
// // Explicitly type the model
// const User: Model<IUser> =
//   mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default FormResponse;