'use server'

import { dbConnect } from '@/db/connection'
import Property from '@/db/models/Property'
import { revalidatePath } from 'next/cache'
import { Types } from 'mongoose'

export async function getAllProperties() {
  await dbConnect()
  const properties = await Property.find({}).sort({ name: 1 })
  return JSON.parse(JSON.stringify(properties))
}

export async function getPropertyById(id: string) {
  await dbConnect()
  if (!Types.ObjectId.isValid(id)) return null
  const property = await Property.findById(id)
  return property ? JSON.parse(JSON.stringify(property)) : null
}

export async function createProperty(formData: FormData) {
  await dbConnect()
  
  try {
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const baseCapacity = parseInt(formData.get('baseCapacity') as string) || 6
    const maxExtraBeds = parseInt(formData.get('maxExtraBeds') as string) || 2
    const imagesString = formData.get('images') as string
    const images = imagesString ? imagesString.split(',').map(s => s.trim()).filter(Boolean) : []

    const property = await Property.create({
      name,
      slug: slug || undefined,
      description,
      baseCapacity,
      maxExtraBeds,
      images,
      isActive: true
    })

    revalidatePath('/admin/properties')
    return { success: true, message: 'Domek dodany pomyślnie', propertyId: property._id.toString() }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Nie udało się dodać domku' }
  }
}

export async function updateProperty(id: string, formData: FormData) {
  await dbConnect()
  
  try {
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const baseCapacity = parseInt(formData.get('baseCapacity') as string) || 6
    const maxExtraBeds = parseInt(formData.get('maxExtraBeds') as string) || 2
    const imagesString = formData.get('images') as string
    const images = imagesString ? imagesString.split(',').map(s => s.trim()).filter(Boolean) : []
    const isActive = formData.get('isActive') === 'true'

    await Property.findByIdAndUpdate(id, {
      name,
      slug: slug || undefined,
      description,
      baseCapacity,
      maxExtraBeds,
      images,
      isActive
    })

    revalidatePath('/admin/properties')
    revalidatePath(`/admin/properties/${id}`)
    return { success: true, message: 'Zmiany zapisane' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Nie udało się zaktualizować domku' }
  }
}

export async function togglePropertyActive(id: string, isActive: boolean) {
  await dbConnect()
  await Property.findByIdAndUpdate(id, { isActive })
  revalidatePath('/admin/properties')
  return { success: true }
}

export async function deleteProperty(id: string) {
  await dbConnect()
  
  const Booking = (await import('@/db/models/Booking')).default
  const existingBookings = await Booking.findOne({ propertyId: id })
  
  if (existingBookings) {
    return { success: false, message: 'Nie można usunąć domku z istniejącymi rezerwacjami' }
  }

  await Property.findByIdAndDelete(id)
  revalidatePath('/admin/properties')
  return { success: true, message: 'Domek usunięty' }
}