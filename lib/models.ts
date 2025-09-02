export interface UserRegistration {
  _id?: string
  name: string
  mobile: string
  gender: "male" | "female" | "other"
  aadharNumber: string
  photoUrl?: string // Renamed to photoUrl for clarity - stores Google Cloud Storage URL
  createdAt: Date
  updatedAt: Date
}

export interface CloudStorageConfig {
  bucketName: string
  projectId: string
  keyFilename?: string
}

export function isValidCloudStorageUrl(url: string): boolean {
  // Validate Google Cloud Storage URL format
  const gcsUrlPattern = /^https:\/\/storage\.googleapis\.com\/[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_/.]+$/
  return gcsUrlPattern.test(url)
}

// Example Mongoose Schema (commented out since we're not using MongoDB in this environment)
/*
import mongoose from 'mongoose'

const userRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  mobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
    unique: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  aadharNumber: {
    type: String,
    required: true,
    match: /^[0-9]{12}$/,
    unique: true
  },
  photoUrl: {
    type: String, // Google Cloud Storage URL
    required: true, // Made required since photo capture is mandatory
    validate: {
      validator: function(url: string) {
        return isValidCloudStorageUrl(url)
      },
      message: 'Invalid Google Cloud Storage URL format'
    }
  }
}, {
  timestamps: true
})

userRegistrationSchema.index({ mobile: 1 })
userRegistrationSchema.index({ aadharNumber: 1 })
userRegistrationSchema.index({ createdAt: -1 })

export const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema)
*/
