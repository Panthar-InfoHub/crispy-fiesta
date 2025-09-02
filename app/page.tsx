"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationForm } from "@/components/registration-form"
import { DataPreview } from "@/components/data-preview"

export default function HomePage() {
  const [formData, setFormData] = useState(null)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Registration</h1>
          <p className="text-muted-foreground">Complete your registration with personal details and photo</p>
        </div>

        <Tabs defaultValue="registration" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="registration" className="text-sm font-medium">
              Registration Form
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-sm font-medium">
              Data Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
                <CardDescription>Please fill in all required fields to complete your registration</CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationForm onDataSubmit={setFormData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Registration Data</CardTitle>
                <CardDescription>Review your submitted information</CardDescription>
              </CardHeader>
              <CardContent>
                <DataPreview data={formData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
