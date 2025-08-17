# Seya Media Hub

A comprehensive media management and streaming platform built with modern technologies. Stream, organize, and share your video, audio, and image content with powerful features and a beautiful interface.

## 🚀 Features

### Core Features
- **Multi-format Support**: Video, audio, and image uploads and streaming
- **High-Quality Streaming**: Adaptive bitrate streaming with multiple resolutions
- **Collaborative Playlists**: Create and share playlists with real-time collaboration
- **Advanced Search**: Powerful search with filters and tags
- **User Management**: Role-based access control with admin and moderator roles
- **Analytics**: Detailed analytics and insights for content performance

### Technical Features
- **Real-time Updates**: Socket.io integration for live features
- **CDN Integration**: Cloudflare CDN for global content delivery
- **Object Storage**: Hetzner Object Storage for scalable file management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Beautiful animations with Framer Motion

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB Atlas** for database
- **Hetzner Object Storage** for file storage
- **Socket.io** for real-time features
- **JWT** for authentication
- **Redis** for caching and queues

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Router** for navigation
- **Zustand** for state management
- **Socket.io Client** for real-time updates

### Infrastructure
- **Cloudflare CDN** for content delivery
- **MongoDB Atlas** for cloud database
- **Hetzner Cloud** for object storage

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account
- Hetzner Cloud account
- Cloudflare account

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seya-media-hub
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - MongoDB Atlas connection string
   - Hetzner Object Storage credentials
   - JWT secret
   - Cloudflare API tokens
   - Email configuration

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your API endpoints.

3. **Start the development server**
   ```bash
   npm start
   ```

### Database Setup

1. **MongoDB Atlas**
   - Create a new cluster
   - Get your connection string
   - Update the `MONGODB_URI` in your `.env` file

2. **Indexes** (automatically created by Mongoose)
   - User indexes for email and username
   - Media indexes for search and filtering
   - Playlist indexes for collaboration

### Storage Setup

1. **Hetzner Object Storage**
   - Create a new bucket
   - Generate access keys
   - Update the Hetzner configuration in your `.env` file

2. **Cloudflare CDN**
   - Add your domain to Cloudflare
   - Configure DNS records
   - Update the CDN configuration

## 🚀 Deployment

### Production Build

1. **Backend**
   ```bash
   cd server
   npm run build
   npm start
   ```

2. **Frontend**
   ```bash
   cd client
   npm run build
   ```

### Environment Variables

Make sure to set all required environment variables in production:

```bash
# Required for production
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
HETZNER_ACCESS_KEY_ID=your-production-access-key
HETZNER_SECRET_ACCESS_KEY=your-production-secret-key
CLIENT_URL=https://yourdomain.com
```

## 📁 Project Structure

```
seya-media-hub/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── socket/        # Socket.io handlers
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Media
- `GET /api/media` - Get media list
- `POST /api/media` - Upload media
- `GET /api/media/:id` - Get media details
- `PUT /api/media/:id` - Update media
- `DELETE /api/media/:id` - Delete media

### Playlists
- `GET /api/playlists` - Get playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/:id` - Get playlist details
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user details

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- File upload security
- Role-based access control

## 📊 Performance Features

- CDN integration for global content delivery
- Image and video optimization
- Lazy loading
- Caching strategies
- Database indexing
- Compression middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@seyamediahub.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] Live streaming capabilities
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] AI-powered content recommendations
- [ ] Multi-language support
- [ ] Advanced collaboration features
- [ ] Integration with social media platforms

---

Built with ❤️ by the Seya Media Hub Team
