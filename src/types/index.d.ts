import { IFormField, IFormSettings } from "@/models/Form";
import { IDeviceInfo, IFormResponseField, ILocationInfo } from "@/models/FormResponse";

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