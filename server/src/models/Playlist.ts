import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  media: {
    mediaId: mongoose.Types.ObjectId;
    addedAt: Date;
    addedBy: mongoose.Types.ObjectId;
    order: number;
  }[];
  isPublic: boolean;
  isCollaborative: boolean;
  thumbnailUrl?: string;
  totalDuration: number; // in seconds
  totalItems: number;
  views: number;
  likes: number;
  shares: number;
  followers: number;
  tags: string[];
  category: string;
  featured: boolean;
  settings: {
    allowComments: boolean;
    allowDownloads: boolean;
    autoPlay: boolean;
    shuffle: boolean;
  };
}

const playlistSchema = new Schema<IPlaylist>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  media: [{
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isCollaborative: {
    type: Boolean,
    default: false
  },
  thumbnailUrl: {
    type: String
  },
  totalDuration: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
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
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  followers: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDownloads: {
      type: Boolean,
      default: true
    },
    autoPlay: {
      type: Boolean,
      default: false
    },
    shuffle: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
playlistSchema.index({ name: 'text', description: 'text', tags: 'text' });
playlistSchema.index({ owner: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ featured: 1 });
playlistSchema.index({ category: 1 });
playlistSchema.index({ views: -1 });
playlistSchema.index({ createdAt: -1 });
playlistSchema.index({ collaborators: 1 });

// Virtual for average duration per item
playlistSchema.virtual('averageDuration').get(function() {
  return this.totalItems > 0 ? this.totalDuration / this.totalItems : 0;
});

// Virtual for engagement rate
playlistSchema.virtual('engagementRate').get(function() {
  const totalEngagement = this.likes + this.shares + this.followers;
  return this.views > 0 ? (totalEngagement / this.views) * 100 : 0;
});

// Pre-save middleware to update total items
playlistSchema.pre('save', function(next) {
  this.totalItems = this.media.length;
  next();
});

// Method to add media to playlist
playlistSchema.methods.addMedia = async function(
  mediaId: mongoose.Types.ObjectId,
  addedBy: mongoose.Types.ObjectId
) {
  const maxOrder = Math.max(...this.media.map(item => item.order), 0);
  
  this.media.push({
    mediaId,
    addedAt: new Date(),
    addedBy,
    order: maxOrder + 1
  });
  
  this.totalItems = this.media.length;
  return this.save();
};

// Method to remove media from playlist
playlistSchema.methods.removeMedia = async function(mediaId: mongoose.Types.ObjectId) {
  this.media = this.media.filter(item => !item.mediaId.equals(mediaId));
  
  // Reorder remaining items
  this.media.forEach((item, index) => {
    item.order = index + 1;
  });
  
  this.totalItems = this.media.length;
  return this.save();
};

// Method to reorder media
playlistSchema.methods.reorderMedia = async function(newOrder: Array<{ mediaId: string; order: number }>) {
  newOrder.forEach(({ mediaId, order }) => {
    const item = this.media.find(item => item.mediaId.toString() === mediaId);
    if (item) {
      item.order = order;
    }
  });
  
  // Sort by order
  this.media.sort((a, b) => a.order - b.order);
  return this.save();
};

// Method to add collaborator
playlistSchema.methods.addCollaborator = async function(userId: mongoose.Types.ObjectId) {
  if (!this.collaborators.includes(userId)) {
    this.collaborators.push(userId);
    this.isCollaborative = true;
    return this.save();
  }
  return this;
};

// Method to remove collaborator
playlistSchema.methods.removeCollaborator = async function(userId: mongoose.Types.ObjectId) {
  this.collaborators = this.collaborators.filter(id => !id.equals(userId));
  this.isCollaborative = this.collaborators.length > 0;
  return this.save();
};

// Method to increment views
playlistSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
