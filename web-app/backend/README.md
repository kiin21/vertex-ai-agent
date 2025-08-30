# Student360 AI Mentoring - Backend API

Ứng dụng backend API cho hệ thống AI Mentoring Student360, được xây dựng bằng NestJS và TypeScript.

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 13.0
- **Google Cloud Account**: Để sử dụng Vertex AI

## 🚀 Hướng dẫn cài đặt và chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Sao chép file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin thực tế:

```env
# Database Configuration (bắt buộc)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=your_db_name

# JWT Secret (bắt buộc - thay đổi trong production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google Cloud Configuration (bắt buộc cho AI features)
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

### 4. Cài đặt Database

#### 4.1. Cài đặt PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Tải và cài đặt từ [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

#### 4.2. Tạo database và user

```bash
sudo -u postgres psql

# Trong PostgreSQL shell:
CREATE DATABASE student_db;
CREATE USER student_api WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE student_db TO student_api;
\q
```

### 5. Chạy migration

```bash
# Chạy các migration để tạo bảng
npm run migration:run

# (Tùy chọn) Seed dữ liệu mẫu
npm run seed
```

### 6. Cấu hình Google Cloud (cho AI features)

#### 6.1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Vertex AI API

#### 6.2. Cài đặt Google Cloud CLI

```bash
# Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# macOS
brew install google-cloud-sdk

# Windows: Tải từ https://cloud.google.com/sdk/docs/install
```

#### 6.3. Xác thực

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login
```

### 7. Chạy ứng dụng

#### Development mode (khuyến nghị cho development)

```bash
npm run start:dev
```

#### Production mode

```bash
npm run build
npm run start:prod
```

#### Debug mode

```bash
npm run start:debug
```

## 📚 API Documentation

Sau khi chạy ứng dụng, truy cập Swagger UI tại:

```
http://localhost:3000/api/docs
```

## 🛠️ Scripts có sẵn

```bash
# Development
npm run start:dev          # Chạy ở chế độ development với watch mode
npm run start:debug        # Chạy với debug mode

# Build & Production
npm run build              # Build ứng dụng
npm run start:prod         # Chạy ở chế độ production

# Code Quality
npm run lint               # Chạy ESLint
npm run format             # Format code với Prettier

# Database
npm run migration:generate # Tạo migration mới
npm run migration:run      # Chạy migration
npm run migration:revert   # Revert migration cuối
npm run seed               # Seed dữ liệu mẫu
npm run seed:clear         # Xóa dữ liệu seed
npm run db:verify          # Kiểm tra kết nối database

# Schema Management
npm run schema:drop        # Xóa toàn bộ schema
npm run schema:sync        # Đồng bộ schema với entities
```

## 🔧 Cấu trúc thư mục

```
src/
├── agents/              # Module quản lý AI agents
├── auth/                # Module xác thực
├── common/              # Shared utilities, guards, decorators
├── config/              # Configuration files
├── database/            # Database migrations, seeds
├── students/            # Module quản lý sinh viên
├── users/               # Module quản lý người dùng
└── main.ts             # Entry point
```

## 🔐 Bảo mật

- **Rate Limiting**: Giới hạn số request từ một IP
- **Helmet**: Bảo vệ ứng dụng khỏi các lỗ hổng web phổ biến
- **CORS**: Cấu hình Cross-Origin Resource Sharing
- **JWT**: Xác thực bằng JSON Web Token
- **Password Hashing**: Mã hóa mật khẩu bằng bcrypt

## 🐳 Docker (Tùy chọn)

Chạy với Docker:

```bash
# Build và chạy với docker-compose
docker-compose up -d

# Hoặc build riêng lẻ
docker build -t student360-backend .
docker run -p 3000:3000 student360-backend
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔍 Troubleshooting

### Database connection issues

1. Kiểm tra PostgreSQL đang chạy: `sudo systemctl status postgresql`
2. Kiểm tra thông tin kết nối trong `.env`
3. Kiểm tra user có quyền truy cập database

### Google Cloud authentication issues

1. Chạy `gcloud auth list` để kiểm tra xác thực
2. Kiểm tra project ID trong `.env`
3. Đảm bảo Vertex AI API đã được enable

### Port conflicts

```bash
# Kiểm tra port đang được sử dụng
sudo lsof -i :3000

# Thay đổi port trong .env
PORT=3001
```

## 📝 Environment Variables

| Variable                  | Description       | Default       | Required |
| ------------------------- | ----------------- | ------------- | -------- |
| `NODE_ENV`                | Môi trường chạy   | `development` | No       |
| `PORT`                    | Port của ứng dụng | `3000`        | No       |
| `DATABASE_HOST`           | Database host     | `localhost`   | Yes      |
| `DATABASE_PORT`           | Database port     | `5432`        | No       |
| `DATABASE_USERNAME`       | Database username | -             | Yes      |
| `DATABASE_PASSWORD`       | Database password | -             | Yes      |
| `DATABASE_NAME`           | Database name     | -             | Yes      |
| `JWT_SECRET`              | JWT secret key    | -             | Yes      |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP Project ID    | -             | Yes      |

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
