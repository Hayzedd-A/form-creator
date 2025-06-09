# Form Creator - Full-Stack Form Builder

A comprehensive form builder application built with Next.js, featuring dynamic form creation, response collection, and analytics.

## 🚀 Features

### 🧑‍💼 Authentication
- Email/password authentication with NextAuth.js
- Protected routes for form creation and management
- User session management

### 📄 Form Creation
- Dynamic form builder with multiple field types:
  - Short text input
  - Paragraph text (textarea)
  - Multiple choice (radio/checkbox)
  - File upload (images)
  - Rating scale (1-5 stars)
- Drag and drop field reordering
- Field validation and requirements
- Unique slug URLs for each form

### 📤 Form Sharing & Submission
- Public form links (no authentication required)
- Email access restrictions
- Response limitations (one per IP/email)
- Open/close date settings
- Assignment mode for educational use

### 📊 Dashboard & Analytics
- User dashboard with form overview
- Response count tracking
- Form management (edit, delete, duplicate)
- Response viewing and analysis
- CSV export functionality

### ✨ UI/UX
- Clean, responsive design with Tailwind CSS
- ShadCN UI components
- Toast notifications
- Mobile-friendly interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **File Upload**: Cloudinary (configured)
- **Validation**: Zod
- **Charts**: Recharts
- **Notifications**: Sonner

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd form-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/form-creator
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   
   # Cloudinary Configuration (optional)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in your `.env.local` file

5. **Generate NextAuth secret**
   ```bash
   openssl rand -base64 32
   ```
   Add this to your `NEXTAUTH_SECRET` environment variable.

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── forms/         # Form CRUD operations
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── forms/             # Form management pages
│   └── form/              # Public form pages
├── components/            # Reusable components
│   ├── ui/               # ShadCN UI components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── mongodb.ts        # Database connection
│   └── utils.ts          # Helper functions
├── models/               # Mongoose models
│   ├── User.ts           # User model
│   ├── Form.ts           # Form model
│   └── FormResponse.ts   # Form response model
└── types/                # TypeScript definitions
```

## 🔧 Configuration

### Database Models

1. **User Model**
   - Email, password, name
   - Timestamps

2. **Form Model**
   - Title, description, slug
   - Dynamic fields array
   - Settings (public, email restrictions, dates)
   - User association

3. **FormResponse Model**
   - Form association
   - Response data
   - Submitter information (IP, email)
   - Timestamps

### API Endpoints

- `POST /api/auth/signup` - User registration
- `GET /api/forms` - Get user's forms
- `POST /api/forms` - Create new form
- `GET /api/forms/[slug]` - Get public form
- `POST /api/forms/[slug]/submit` - Submit form response

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/form-creator
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔮 Future Enhancements

- [ ] Real-time response updates with WebSockets
- [ ] Form templates library
- [ ] Advanced analytics and charts
- [ ] Email notifications
- [ ] Form themes and customization
- [ ] Conditional logic for fields
- [ ] Integration with external services
- [ ] Multi-language support
- [ ] Advanced file upload handling
- [ ] Form collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and modern web technologies.