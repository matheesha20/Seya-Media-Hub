import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Tenant extends Document {
  slug: string;
  name: string;
  plan: string;
  usage: {
    storageBytes: number;
    egressBytes: number;
    transformCount: number;
    apiCalls: number;
  };
  cdnBaseUrl: string;
  storage: {
    provider: string;
    bucket: string;
    region: string;
    endpoint: string;
    publicBaseUrl: string;
  };
  deliverySecret: string;
  webhookSecret: string;
  createdAt: Date;
}

const TenantSchema = new Schema<Tenant>({
  slug: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  plan: { type: String, required: true },
  usage: {
    storageBytes: { type: Number, default: 0 },
    egressBytes: { type: Number, default: 0 },
    transformCount: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 }
  },
  cdnBaseUrl: String,
  storage: {
    provider: String,
    bucket: String,
    region: String,
    endpoint: String,
    publicBaseUrl: String
  },
  deliverySecret: String,
  webhookSecret: String,
  createdAt: { type: Date, default: Date.now }
});

export const TenantModel = mongoose.model<Tenant>('Tenant', TenantSchema);

export interface User extends Document {
  email: string;
  passwordHash: string;
  provider: string;
  createdAt: Date;
}

const UserSchema = new Schema<User>({
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  provider: { type: String, default: 'local' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<User>('User', UserSchema);

export interface Membership extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: Date;
}

const MembershipSchema = new Schema<Membership>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], required: true },
  createdAt: { type: Date, default: Date.now }
});
MembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const MembershipModel = mongoose.model<Membership>('Membership', MembershipSchema);

export interface ApiKey extends Document {
  tenantId: Types.ObjectId;
  name: string;
  keyHash: string;
  scopes: string[];
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<ApiKey>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: String,
  keyHash: String,
  scopes: [String],
  lastUsedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export const ApiKeyModel = mongoose.model<ApiKey>('ApiKey', ApiKeySchema);

export interface Asset extends Document {
  tenantId: Types.ObjectId;
  publicId: string;
  kind: 'image' | 'video' | 'raw';
  originalPath: string;
  mime: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  metadata: any;
  createdAt: Date;
}

const AssetSchema = new Schema<Asset>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  publicId: { type: String, required: true },
  kind: { type: String, enum: ['image', 'video', 'raw'], required: true },
  originalPath: String,
  mime: String,
  width: Number,
  height: Number,
  duration: Number,
  bytes: Number,
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
AssetSchema.index({ tenantId: 1, publicId: 1 }, { unique: true });

export const AssetModel = mongoose.model<Asset>('Asset', AssetSchema);

export interface Variant extends Document {
  tenantId: Types.ObjectId;
  assetId: Types.ObjectId;
  paramsHash: string;
  path: string;
  bytes: number;
  createdAt: Date;
}

const VariantSchema = new Schema<Variant>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  paramsHash: String,
  path: String,
  bytes: Number,
  createdAt: { type: Date, default: Date.now }
});
VariantSchema.index({ tenantId: 1, assetId: 1, paramsHash: 1 }, { unique: true });

export const VariantModel = mongoose.model<Variant>('Variant', VariantSchema);

export interface Job extends Document {
  tenantId: Types.ObjectId;
  type: string;
  status: string;
  input: any;
  output: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<Job>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: String,
  status: String,
  input: Schema.Types.Mixed,
  output: Schema.Types.Mixed,
  error: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const JobModel = mongoose.model<Job>('Job', JobSchema);

export interface UsageLog extends Document {
  tenantId: Types.ObjectId;
  type: 'UPLOAD' | 'TRANSFORM' | 'DELIVERY' | 'API';
  amount: number;
  unit: string;
  meta: any;
  createdAt: Date;
}

const UsageLogSchema = new Schema<UsageLog>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: { type: String, enum: ['UPLOAD', 'TRANSFORM', 'DELIVERY', 'API'], required: true },
  amount: Number,
  unit: String,
  meta: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

export const UsageLogModel = mongoose.model<UsageLog>('UsageLog', UsageLogSchema);

export interface WebhookEndpoint extends Document {
  tenantId: Types.ObjectId;
  url: string;
  isActive: boolean;
  createdAt: Date;
}

const WebhookEndpointSchema = new Schema<WebhookEndpoint>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  url: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const WebhookEndpointModel = mongoose.model<WebhookEndpoint>('WebhookEndpoint', WebhookEndpointSchema);

export async function connectMongo(uri: string) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}
