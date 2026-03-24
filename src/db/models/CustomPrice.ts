import mongoose, {Schema, Document} from 'mongoose';

const CustomPriceSchema = new Schema({
    propertyId: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    weekdayExtraBedPrice: {
        type: Number,
        required: true,
        min: 0
    },
    weekendExtraBedPrice: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

CustomPriceSchema.index({propertyId: 1, date: 1}, {unique: true})

export default mongoose.models.CustomPrice || mongoose.model('CustomPrice', CustomPriceSchema);