# Chirp

A Twitter-like social media platform built with Node.js, Express, and MongoDB.

## Features

- **User Authentication** - Register, login, and session management
- **Posts** - Create, delete, and view posts with 280 character limit
- **Likes & Retweets** - Interact with posts from other users
- **Comments** - Comment on posts
- **Follow System** - Follow/unfollow other users
- **Notifications** - Real-time notifications for likes, retweets, follows, and comments
- **User Profiles** - View user profiles with post history
- **Search** - Search for users and posts
- **Image Uploads** - Upload profile pictures and post images
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Template Engine**: Pug
- **Styling**: Tailwind CSS
- **Authentication**: bcrypt, express-session
- **File Uploads**: Multer
- **Security**: Helmet, express-rate-limit, express-validator

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chirp.git
cd chirp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chirp
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret-key
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm test` | Run tests with coverage |

## Project Structure

```
chirp/
├── config/
│   └── connection.js       # MongoDB connection
├── public/
│   ├── js/
│   │   ├── common.js       # Shared JavaScript
│   │   ├── feed.js         # Feed page logic
│   │   └── profile.js      # Profile page logic
│   └── images/             # Static images
├── src/
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Express middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Route definitions
│   └── views/              # Pug templates
├── tests/                  # Test files
├── uploads/                # User uploaded files
├── app.js                  # Express app setup
└── server.js               # Entry point
```

## API Endpoints

### Authentication
- `GET /register` - Registration page
- `POST /register` - Create new account
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `GET /logout` - End session

### Posts
- `GET /api/posts` - Get all posts (with pagination)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `DELETE /api/posts/:id` - Delete post
- `PUT /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/retweet` - Retweet/unretweet post
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment

### Follow
- `PUT /api/follow/:userId` - Follow/unfollow user
- `GET /api/follow/:userId/followers` - Get followers
- `GET /api/follow/:userId/following` - Get following

### Upload
- `POST /api/upload/profile` - Upload profile picture
- `POST /api/upload/post` - Upload post image

### Pages
- `GET /` - Home feed
- `GET /search` - Search page
- `GET /profile/:username` - User profile
- `GET /notifications` - Notifications

## Security Features

- Password hashing with bcrypt (12 rounds)
- Session-based authentication with secure cookies
- Rate limiting on API and auth routes
- Input validation with express-validator
- Security headers with Helmet
- XSS protection in templates

## License

ISC
