"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { submitRegistration } from "@/lib/actions"
import { uploadImageToCloud, base64ToBlob } from "@/lib/cloud-storage"

interface FormData {
  name: string
  mobile: string
  gender: string
  aadharNumber: string
  photo: string | null // Now stores cloud URL instead of base64
}

interface RegistrationFormProps {
  onDataSubmit: (data: FormData) => void
}

export function RegistrationForm({ onDataSubmit }: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobile: "",
    gender: "",
    aadharNumber: "",
    photo: null,
  })

  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // Added upload state
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null) // Store base64 for preview

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      setStream(mediaStream)
      setIsCapturing(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)

        setCapturedImageData(photoDataUrl)
        setIsUploading(true)
        stopCamera()

        try {
          // Convert base64 to blob and upload to cloud
          const imageBlob = base64ToBlob(photoDataUrl)
          const fileName = `photo-${Date.now()}.jpg`
          const cloudImageUrl = await uploadImageToCloud(imageBlob, fileName)

          // Store the cloud URL in form data
          setFormData((prev) => ({ ...prev, photo: cloudImageUrl }))
          console.log("[v0] Image uploaded to cloud:", cloudImageUrl)
        } catch (error) {
          console.error("[v0] Failed to upload image:", error)
          alert("Failed to upload image. Please try again.")
          setCapturedImageData(null)
        } finally {
          setIsUploading(false)
        }
      }
    }
  }

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }))
    setCapturedImageData(null) // Clear preview image
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.mobile || !formData.gender || !formData.aadharNumber || !formData.photo) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Submit to server action (placeholder for now)
      await submitRegistration(formData)
      onDataSubmit(formData)
      alert("Registration submitted successfully!")
    } catch (error) {
      console.error("Submission error:", error)
      alert("Error submitting registration. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-sm font-medium">
            Mobile Number *
          </Label>
          <Input
            id="mobile"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={formData.mobile}
            onChange={(e) => handleInputChange("mobile", e.target.value)}
            pattern="[0-9]{10}"
            maxLength={10}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-medium">
            Gender *
          </Label>
          <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aadhar" className="text-sm font-medium">
            Aadhar Card Number *
          </Label>
          <Input
            id="aadhar"
            type="text"
            placeholder="Enter 12-digit Aadhar number"
            value={formData.aadharNumber}
            onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
            pattern="[0-9]{12}"
            maxLength={12}
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Photo Capture *</Label>

        {!formData.photo && !isCapturing && !isUploading && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center">Capture your photo using the camera</p>
              <Button type="button" onClick={startCamera} className="gap-2">
                <Camera className="h-4 w-4" />
                Start Camera
              </Button>
            </CardContent>
          </Card>
        )}

        {isCapturing && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-4">
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-lg border" />
                <div className="flex gap-2">
                  <Button type="button" onClick={capturePhoto} className="gap-2" disabled={isUploading}>
                    <Upload className="h-4 w-4" />
                    Capture Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isUploading && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading image to cloud storage...</p>
                </div>
                {capturedImageData && (
                  <img
                    src={capturedImageData || "/placeholder.svg"}
                    alt="Uploading photo"
                    className="w-48 h-48 object-cover rounded-lg border opacity-50"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {formData.photo && !isUploading && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={capturedImageData || "/placeholder.svg"}
                    alt="Captured photo"
                    className="w-48 h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Photo uploaded successfully</p>
                  <p className="text-xs text-muted-foreground mt-1">Stored in cloud storage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting || isUploading}>
        {isSubmitting ? "Submitting..." : "Submit Registration"}
      </Button>
    </form>
  )
}
