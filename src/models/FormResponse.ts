import mongoose, { Document, Schema } from 'mongoose'

export interface IFormResponseField {
  fieldId: string
  value: string | string[] | number
  fileUrl?: string // for file uploads
}

export interface IFormResponse extends Document {
  formId: mongoose.Types.ObjectId
  responses: IFormResponseField[]
  submitterEmail?: string
  submitterIp: string
  createdAt: Date
  updatedAt: Date
}

const FormResponseFieldSchema = new Schema<IFormResponseField>({
  fieldId: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  fileUrl: { type: String }
})

const FormResponseSchema = new Schema<IFormResponse>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: 'Form',
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
}, {
  timestamps: true,
})

// Index for efficient querying
FormResponseSchema.index({ formId: 1, createdAt: -1 })
FormResponseSchema.index({ formId: 1, submitterEmail: 1 })
FormResponseSchema.index({ formId: 1, submitterIp: 1 })

export default mongoose.models.FormResponse || mongoose.model<IFormResponse>('FormResponse', FormResponseSchema)