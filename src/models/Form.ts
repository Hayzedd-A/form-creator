import mongoose, { Document, Schema } from "mongoose";

export interface IFormField {
  id: string;
  type:
    | "short-text"
    | "paragraph"
    | "multiple-choice"
    | "file-upload"
    | "rating"
    | "linear-scale"
    | "yes-no"
    | "dropdown"
    | "checkbox"
    | "email"
    | "number"
    | "date"
    | "datetime"
    | "address";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for multiple choice, dropdown, checkbox
  allowMultiple?: boolean; // for multiple choice (checkbox vs radio)
  maxRating?: number; // for rating fields
  maxScale?: number; // for linear scale fields
  minScale?: number; // for linear scale fields
  scaleLabels?: { min: string; max: string }; // for linear scale
  correctAnswer?: any; // for assignment mode
  points?: number; // for assignment mode scoring
  explanation?: string; // for assignment mode feedback
  order: number;
}

export interface IFormSettings {
  isPublic: boolean;
  allowedEmails: string[];
  limitOneResponse: boolean;
  limitByEmail: boolean;
  openDate?: Date;
  closeDate?: Date;
  assignmentMode: boolean;
  collectEmail: boolean;
  collectIP: boolean;
  collectLocation: boolean;
  collectDeviceInfo: boolean;
  requireAuth: boolean;
  allowDrafts: boolean;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  timeLimit?: number; // in minutes
  passingScore?: number; // percentage for assignment mode
  showCorrectAnswers: boolean;
  allowRetakes: boolean;
  maxRetakes?: number;
  customTheme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
}

export interface IForm extends Document {
  title: string;
  description?: string;
  slug: string;
  userId: mongoose.Types.ObjectId;
  fields: IFormField[];
  settings: IFormSettings;
  isActive: boolean;
  totalPoints?: number; // calculated from field points
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "short-text",
      "paragraph",
      "multiple-choice",
      "file-upload",
      "rating",
      "linear-scale",
      "yes-no",
      "dropdown",
      "checkbox",
      "email",
      "number",
      "date",
      "datetime",
      "address",
    ],
  },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
  options: [{ type: String }],
  allowMultiple: { type: Boolean, default: false },
  maxRating: { type: Number, default: 5 },
  maxScale: { type: Number, default: 10 },
  minScale: { type: Number, default: 1 },
  scaleLabels: {
    min: { type: String },
    max: { type: String },
  },
  correctAnswer: { type: Schema.Types.Mixed },
  points: { type: Number, default: 1 },
  explanation: { type: String },
  order: { type: Number, required: true },
});

const FormSettingsSchema = new Schema<IFormSettings>({
  isPublic: { type: Boolean, default: true },
  allowedEmails: [{ type: String }],
  limitOneResponse: { type: Boolean, default: false },
  limitByEmail: { type: Boolean, default: false },
  openDate: { type: Date },
  closeDate: { type: Date },
  assignmentMode: { type: Boolean, default: false },
  collectEmail: { type: Boolean, default: false },
  collectIP: { type: Boolean, default: true },
  collectLocation: { type: Boolean, default: false },
  collectDeviceInfo: { type: Boolean, default: false },
  requireAuth: { type: Boolean, default: false },
  allowDrafts: { type: Boolean, default: false },
  showProgressBar: { type: Boolean, default: true },
  randomizeQuestions: { type: Boolean, default: false },
  timeLimit: { type: Number },
  passingScore: { type: Number, default: 70 },
  showCorrectAnswers: { type: Boolean, default: false },
  allowRetakes: { type: Boolean, default: false },
  maxRetakes: { type: Number, default: 1 },
  customTheme: {
    primaryColor: { type: String },
    backgroundColor: { type: String },
    fontFamily: { type: String },
  },
});

const FormSchema = new Schema<IForm>(
  {
    title: {
      type: String,
      required: [true, "Form title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fields: [FormFieldSchema],
    settings: {
      type: FormSettingsSchema,
      default: () => ({}),
    },
    isActive: { type: Boolean, default: true },
    totalPoints: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Calculate total points when fields change
FormSchema.pre("save", function (next) {
  if (this.settings.assignmentMode) {
    this.totalPoints = this.fields.reduce(
      (sum, field) => sum + (field.points || 1),
      0
    );
  }
  next();
});

// Indexes for better performance
FormSchema.index({ userId: 1, createdAt: -1 });
// FormSchema.index({ slug: 1 });
FormSchema.index({ isActive: 1 });

export default mongoose.models.Form ||
  mongoose.model<IForm>("Form", FormSchema);
