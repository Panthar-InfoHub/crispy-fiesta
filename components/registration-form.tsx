"use client"

import type React from "react"
import { useState, useRef, useEffect, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { submitRegistration, uploadImageToCloud } from "@/lib/actions"
import { User } from "@/lib/models"


interface RegistrationFormProps {
  onDataSubmit: (data: FormData) => void
}

export function RegistrationForm({ onDataSubmit }: RegistrationFormProps) {


  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null) // Store base64 for preview
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [prefersFileCapture, setPrefersFileCapture] = useState(false) // Prefer file capture on mobile/iOS

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // File input fallback
  const formRef = useRef<HTMLFormElement>(null) // Add form ref

  useEffect(() => {
    // Prefer file capture on iOS Safari or when getUserMedia is unavailable / insecure context
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
    const isIOS = /iP(hone|od|ad)/.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    const noMedia = typeof navigator === "undefined" || !("mediaDevices" in navigator)
    const insecure = typeof isSecureContext !== "undefined" ? !isSecureContext : false

    if (isIOS && isSafari) setPrefersFileCapture(true)
    if (noMedia || insecure) setPrefersFileCapture(true)

    return () => {
      // Stop camera if active
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const startCamera = async () => {
    try {
      console.log("\nStarting camera....")
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setIsCapturing(true)

      if (videoRef.current) {
        videoRef.current.muted = true
        videoRef.current.setAttribute("playsinline", "true")
        videoRef.current.playsInline = true
        videoRef.current.srcObject = mediaStream

        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            console.log("[v0] video loadedmetadata:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
            videoRef.current?.removeEventListener("loadedmetadata", onLoaded)
            resolve()
          }
          videoRef.current?.addEventListener("loadedmetadata", onLoaded, { once: true })
        })

        try {
          await videoRef.current.play()
          console.log("[v0] video.play() resolved; readyState:", videoRef.current.readyState)
        } catch (err) {
          console.log("[v0] video.play() rejected; will rely on user gesture:", (err as Error)?.message)
        }
      }

      setStream(mediaStream)
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.",)
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

      if (!video.videoWidth || !video.videoHeight) {
        await new Promise<void>((resolve) => {
          const onCanPlay = () => {
            video.removeEventListener("canplay", onCanPlay)
            resolve()
          }
          video.addEventListener("canplay", onCanPlay, { once: true })
        })
      }
      // wait a frame so the first image is actually rendered
      await new Promise((r) => requestAnimationFrame(() => r(null as any)))

      console.log("capturing with dimensions:", video.videoWidth, "x", video.videoHeight)
      canvas.width = video.videoWidth || 720
      canvas.height = video.videoHeight || 1280

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (!blob) return

          const imageUrl = URL.createObjectURL(blob)
          setCapturedImageData(imageUrl)

          const file = new File([blob], `user-${Date.now()}.jpg`, { type: "image/jpeg" })
          setPhotoFile(file)

          console.log("Photo captured locally")
        }, "image/jpeg", 0.9)

        stopCamera()
      }
    }
  }

  const removePhoto = () => {
    if (capturedImageData && capturedImageData.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(capturedImageData)
      } catch {
        // no-op
      }
    }
    setCapturedImageData(null)
    setPhotoFile(null)
  }

  const registrationFormSubmission = async (prevData, formData: FormData) => {
    // Validate photo is captured
    if (!photoFile) {
      alert("Please capture a photo before submitting")
      return
    }

    formData.append('file', photoFile)
    const { success, destination } = await uploadImageToCloud(formData)

    console.debug("\n Image destination ==> ", destination)

    const user = new User({
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      gender: formData.get("gender") as "male" | "female" | "other",
      aadharNumber: formData.get("aadharNumber") as string,
      photoUrl: destination as string,
    })
    await user.save()
    console.log("User created ==> ", user)
  }

  const [state, formAction, isPending] = useActionState(registrationFormSubmission, {})


  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            name="name"
            placeholder="Enter your full name"
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
            name="mobile"
            placeholder="Enter 10-digit mobile number"
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
          <Select name="gender">
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
            name="aadharNumber"
            pattern="[0-9]{12}"
            maxLength={12}
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Photo Capture *</Label>

        {!photoFile && !isCapturing && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
              <Camera className="h-12 w-12 text-muted-foreground mb-1" />
              <p className="text-sm text-muted-foreground text-center">
                Capture your photo using the camera
              </p>
              <Button type="button" onClick={startCamera} className="gap-2" variant="default">
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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-md rounded-lg border aspect-video bg-black"
                />
                <div className="flex gap-2">
                  <Button type="button" onClick={capturePhoto} className="gap-2">
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

        {photoFile && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={capturedImageData || "/placeholder.svg"}
                    alt="Captured or uploaded photo preview"
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

      <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isPending}>
        {isPending ? <div className="flex items-center gap-4" > "Submitting..." <Loader2 className="animate-spin" /> </div> : "Submit Registration"}
      </Button>
    </form>
  )
}
