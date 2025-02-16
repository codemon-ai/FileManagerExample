
# File Upload/Download System

A web application for uploading and managing files using React, Express, and AWS S3.

## Features

- File upload with drag & drop support
- File size validation (max 50MB)
- File list with download capabilities
- AWS S3 integration for secure file storage
- PostgreSQL database for file metadata storage

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - TanStack Query
  - Tailwind CSS
  - Shadcn UI Components

- Backend:
  - Express.js
  - PostgreSQL (via Drizzle ORM)
  - AWS S3 for file storage

## Setup

1. Environment Variables
   Required environment variables in Replit Secrets:
   ```
   AWS_BUCKET_NAME=your-bucket-name
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=ap-northeast-2
   DATABASE_URL=your-database-url
   PGUSER=your-pg-user
   PGPASSWORD=your-pg-password
   PGDATABASE=your-pg-database
   PGHOST=your-pg-host
   PGPORT=your-pg-port
   ```

2. Running the Project
   - Click the Run button to start the development server
   - The application will be available on port 5000

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Backend Express server
└── shared/          # Shared types and schemas
```

## API Endpoints

- `GET /api/files` - List all files
- `POST /api/files/upload-url` - Get pre-signed URL for file upload
- `GET /api/files/:id/download` - Get file download URL

## Development

The project uses Vite for frontend development and tsx for running the backend TypeScript code.

To start development:
1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`

## ToDo

- [] 대용량 파일 테스트 필요
- [] 업로드 금지 옵션 넣기
- [] 람다로 전환
- [] 관련 VPC 작업