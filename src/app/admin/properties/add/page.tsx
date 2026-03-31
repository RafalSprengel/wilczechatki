import Property from '@/db/models/Property';
import dbConnect from '@/db/connection';
import AddPropertyForm from './AddPropertyForm';

export default async function AddPropertyPage() {
  await dbConnect();
  
  const wholeProperty = await Property.findOne({ type: 'whole', isActive: true });
  const isWholePropertyExists = !!wholeProperty;

  return <AddPropertyForm isWholePropertyExists={isWholePropertyExists} />;
}