import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  title: string;
  description?: string;
  type: 'video' | 'audio' | 'image';
  category: string;
  tags: string[];
  owner: mongoose.Types.ObjectId;
  fileUrl: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  size: number; // in bytes
  format: string;
  resolution?: {
    width: number;
    height: number;
  };
  bitrate?: number;
  fps?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress: number; // 0-100
  isPublic: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  rating: number;
  metadata: {
    artist?: string;
    album?: string;
    year?: number;
    genre?: string;
    language?: string;
    subtitles?: string[];
  };
  permissions: {
    canDownload: boolean;
    canShare: boolean;
    canComment: boolean;
  };
  analytics: {
    dailyViews: number[];
    weeklyViews: number[];
    monthlyViews: number[];
    peakConcurrentViewers: number;
    averageWatchTime: number;
  };
}

const mediaSchema = new Schema<IMedia>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'image'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number,
    min: 0
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  format: {
    type: String,
    required: true
  },
  resolution: {
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    }
  },
  bitrate: {
    type: Number,
    min: 0
  },
  fps: {
    type: Number,
    min: 0
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  dislikes: {
    type: Number,
    default: 0,
    min: 0
  },
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  metadata: {
    artist: String,
    album: String,
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear()
    },
    genre: String,
    language: String,
    subtitles: [String]
  },
  permissions: {
    canDownload: {
      type: Boolean,
      default: true
    },
    canShare: {
      type: Boolean,
      default: true
    },
    canComment: {
      type: Boolean,
      default: true
    }
  },
  analytics: {
    dailyViews: [{
      type: Number,
      default: 0
    }],
    weeklyViews: [{
      type: Number,
      default: 0
    }],
    monthlyViews: [{
      type: Number,
      default: 0
    }],
    peakConcurrentViewers: {
      type: Number,
      default: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
mediaSchema.index({ title: 'text', description: 'text', tags: 'text' });
mediaSchema.index({ owner: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ category: 1 });
mediaSchema.index({ isPublic: 1 });
mediaSchema.index({ isFeatured: 1 });
mediaSchema.index({ views: -1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ processingStatus: 1 });

// Virtual for engagement rate
mediaSchema.virtual('engagementRate').get(function() {
  const totalEngagement = this.likes + this.shares + this.comments;
  return this.views > 0 ? (totalEngagement / this.views) * 100 : 0;
});

// Virtual for like ratio
mediaSchema.virtual('likeRatio').get(function() {
  const totalVotes = this.likes + this.dislikes;
  return totalVotes > 0 ? (this.likes / totalVotes) * 100 : 0;
});

// Pre-save middleware to update processing status
mediaSchema.pre('save', function(next) {
  if (this.processingProgress === 100 && this.processingStatus === 'processing') {
    this.processingStatus = 'completed';
  }
  next();
});

// Method to increment views
mediaSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Method to toggle like/dislike
mediaSchema.methods.toggleLike = async function(userId: string, action: 'like' | 'dislike') => {
  // This would typically involve a separate Like model
  // For now, we'll just increment the counter
  if (action === 'like') {
    this.likes += 1;
  } else {
    this.dislikes += 1;
  }
  return this.save();
};

export const Media = mongoose.model<IMedia>('Media', mediaSchema);
