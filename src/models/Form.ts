import mongoose, { Document, Schema } from 'mongoose'

export interface IFormField {
  id: string
  type: 'short-text' | 'paragraph' | 'multiple-choice' | 'file-upload' | 'rating'
  label: string
  required: boolean
  placeholder?: string
  options?: string[] // for multiple choice
  allowMultiple?: boolean // for multiple choice (checkbox vs radio)
  maxRating?: number // for rating fields
  order: number
}

export interface IForm extends Document {
  title: string
  description?: string
  slug: string
  userId: mongoose.Types.ObjectId
  fields: IFormField[]
  settings: {
    isPublic: boolean
    allowedEmails: string[]
    limitOneResponse: boolean
    limitByEmail: boolean
    openDate?: Date
    closeDate?: Date
    assignmentMode: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const FormFieldSchema = new Schema<IFormField>({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['short-text', 'paragraph', 'multiple-choice', 'file-upload', 'rating']
  },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
  options: [{ type: String }],
  allowMultiple: { type: Boolean, default: false },
  maxRating: { type: Number, default: 5 },
  order: { type: Number, required: true }
})

const FormSchema = new Schema<IForm>({
  title: {
    type: String,
    required: [true, 'Form title is required'],
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
    ref: 'User',
    required: true,
  },
  fields: [FormFieldSchema],
  settings: {
    isPublic: { type: Boolean, default: true },
    allowedEmails: [{ type: String }],
    limitOneResponse: { type: Boolean, default: false },
    limitByEmail: { type: Boolean, default: false },
    openDate: { type: Date },
    closeDate: { type: Date },
    assignmentMode: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
})

export default mongoose.models.Form || mongoose.model<IForm>('Form', FormSchema)