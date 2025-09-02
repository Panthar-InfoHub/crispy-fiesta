"use server"

interface FormData {
  name: string
  mobile: string
  gender: string
  aadharNumber: string
  photo: string | null // Now stores cloud storage URL instead of base64
}

export async function submitRegistration(data: FormData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log("[v0] Registration data received:", {
    name: data.name,
    mobile: data.mobile,
    gender: data.gender,
    aadharNumber: data.aadharNumber,
    photoUrl: data.photo, // Now logs the actual cloud URL
    hasPhoto: !!data.photo,
  })

  // Validate required fields
  if (!data.name || !data.mobile || !data.gender || !data.aadharNumber || !data.photo) {
    throw new Error("All fields including photo are required")
  }

  // Validate mobile number format
  if (!/^[0-9]{10}$/.test(data.mobile)) {
    throw new Error("Mobile number must be exactly 10 digits")
  }

  // Validate Aadhar number format
  if (!/^[0-9]{12}$/.test(data.aadharNumber)) {
    throw new Error("Aadhar number must be exactly 12 digits")
  }

  // Example MongoDB operations would go here:
  /*
  const client = new MongoClient(process.env.MONGODB_URI)
  await client.connect()
  const db = client.db('registration')
  const collection = db.collection('users')
  
  const result = await collection.insertOne({
    name: data.name,
    mobile: data.mobile,
    gender: data.gender,
    aadharNumber: data.aadharNumber,
    photoUrl: data.photo, // Store the Google Cloud Storage URL
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  await client.close()
  return { success: true, id: result.insertedId }
  */

  return { success: true, message: "Registration submitted successfully with cloud image" }
}
