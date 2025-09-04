"use server"

import { Storage } from "@google-cloud/storage"


export async function submitRegistration(formData: FormData) {

  console.log("Registration data received:", {
    name: formData.get('name'),
    mobile: formData.get('mobile'),
    gender: formData.get('gender'),
    aadharNumber: formData.get('aadharnumber'),
    photoUrl: formData.get('photo'),
  })

  // Validate required fields
  if (!formData.get('name') || !formData.get('mobile') || !formData.get('gender') || !formData.get('aadharNumber')) {
    throw new Error("All fields including photo are required")
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

export async function uploadImageToCloud(data: FormData) {

  const storage = new Storage({
    projectId: "",
    credentials: {
      client_email: "",
      private_key: ""
    }
  })

  const bucketName = ""

  try {
    const destination = `users/${data.get('name')}/avatar.png`;

    // Get the file from FormData
    const file = data.get('file');
    if (!(file instanceof File)) {
      throw new Error("Uploaded file is missing or invalid");
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GCS 
    console.debug("\n\n Start uploading image to gcs...")
    const bucketFile = storage.bucket(bucketName).file(destination);
    await bucketFile.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "no-cache",
      },
    })
    console.debug("\n image upload to server successfully...")

    return { success: true, destination }

  } catch (error) {
    console.error("Error while uploading data on cloud", error)
    return { success: false }
  }
}