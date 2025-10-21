import mongoose from 'mongoose';

// Define the reaction schema as a subdocument
const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return !this.groupId;
      },
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },

    text: {
      type: String,
    },
    encryptedText: {
      type: Object,
      default: null,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    // Voice message properties
    voiceMessage: {
      type: String, // URL to the voice message file
    },
    voiceDuration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    voiceWaveform: {
      type: [Number], // Array of amplitude values for waveform visualization
      default: [],
    },
    // Add the reactions array to the message schema
    reactions: {
      type: [reactionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
