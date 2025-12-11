import mongoose, { Schema, Document} from 'mongoose';

export interface IChat extends Document {
    users: string[];
    latestMessage: {
        sender: string;
        text: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const schema: Schema<IChat> = new Schema({
    users: [{
        type: String,
        required: true,
    }],
    latestMessage: {
        sender: {
            type: String,
        },
        text: {
            type: String,
        },
    },

}, {
    timestamps: true,
});

export const Chat = mongoose.model<IChat>('Chat', schema);