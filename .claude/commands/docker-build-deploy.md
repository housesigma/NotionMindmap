# Docker Build and Deploy Command

## Description
Automatically generate Dockerfile, build Docker image, save as tar, and deploy to internal-tools platform.

**⚠️ IMPORTANT RESTRICTION: This command will NOT modify any existing user code. It only creates a new Dockerfile if one doesn't exist, and performs build/deploy operations.**

**🖥️ CROSS-PLATFORM SUPPORT: Works on Windows, macOS, and Linux. Claude will detect your system and use appropriate commands.**

## Usage
```
/docker-build-deploy [app-name] [description] [api-token]
```

## Parameters
- `app-name`: Name of the application (required) - **Must follow DNS-1123 label format**
- `description`: Application description (optional, defaults to auto-generated)
- `api-token`: API access token (optional, will prompt if not provided)

**App Name (app_key) Requirements:**
- Must follow DNS-1123 label standard
- Only lowercase letters (a-z), numbers (0-9), and hyphens (-) allowed
- Must start and end with alphanumeric character
- Length: 1-63 characters
- Examples: ✅ `my-app`, `web-server-v2`, `api123` | ❌ `My-App`, `web_server`, `app-`

**Port Detection**: Claude will automatically detect the container port by analyzing:
1. **Dockerfile**: `EXPOSE` directive
2. **Package.json**: Scripts and dependencies (React→3000, Express→3000)
3. **Project files**: Go→8080, Python Flask→5000, Django→8000
4. **Default fallback**: 3000 (most common for internal tools)

## Implementation

I'll help you package and deploy your project with the following steps:

1. **Analyze Project Structure**: Detect project type and dependencies
2. **Generate Dockerfile**: Create optimized Dockerfile ONLY if one doesn't exist (no existing code modification)
3. **Build Docker Image**: Build with proper platform support (--platform linux/amd64 for ARM64)
4. **Save as TAR**: Export image to tar file for upload
5. **Upload to Registry**: Upload tar file via API
6. **Deploy Application**: Deploy to internal-tools platform
7. **Verify Deployment**: Check deployment status

**🛡️ Code Protection**: This command will never modify your existing code files. If a Dockerfile already exists, it will use the existing one.

**Cross-Platform Implementation:**
Claude will detect your operating system and execute the appropriate commands using its built-in tools. No shell scripting required!

Let me start by analyzing your project structure to determine the best Dockerfile approach. I'll use Claude's built-in tools to examine your project files and detect the project type.

Based on the project structure, I'll generate an appropriate Dockerfile. Common patterns include:

**Node.js/TypeScript Project:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Python Project:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
```

**Go Project:**
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

## Execution Steps

I'll perform these operations using Claude's cross-platform tools:

### 1. **Project Analysis & App Name Validation**
- Use `Bash` tool to list project files (works on all platforms)
- Detect project type from package.json, requirements.txt, etc.
- Check if Dockerfile already exists
- **Validate and normalize app name** to DNS-1123 format:
  - Convert to lowercase
  - Replace underscores and spaces with hyphens
  - Remove invalid characters
  - Ensure starts/ends with alphanumeric
  - Warn user if modifications are made
- **Auto-detect container port** by analyzing:
  - Existing Dockerfile `EXPOSE` directives
  - Package.json dependencies (React/Next.js → 3000, Express → 3000)
  - Python files (Flask → 5000, Django → 8000, FastAPI → 8000)
  - Go files → 8080
  - Java files → 8080
  - Default fallback → 3000

### 2. **Architecture Detection**
- **Windows**: Use `Bash` tool with `systeminfo` or check environment
- **macOS/Linux**: Use `uname -m` command
- Apply `--platform linux/amd64` for ARM64 systems

### 3. **Dockerfile Generation** (Only if needed)
- Check existing Dockerfile first
- Ask user confirmation before creating new files
- Generate appropriate Dockerfile based on detected project type

### 4. **Docker Operations**
- **Build**: `docker build [--platform linux/amd64] -t app:latest .`
- **Save**: `docker save app:latest -o app.tar`
- Commands work identically on Windows/macOS/Linux

### 5. **API Upload & Deploy**

**Upload Image API Call:**
```bash
curl -X POST http://3.96.155.43:30000/api/v1/internal-tools/upload-image \
  -H "Authorization: Bearer {api-token}" \
  -F "image=@{app-name}.tar" \
  -F "app_key={app-name}"
```

**Deploy Application API Call:**
```bash
curl -X POST http://3.96.155.43:30000/api/v1/internal-tools/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {api-token}" \
  -d '{
    "app_info": {
      "app_key": "{app-name}",
      "description": "{description}"
    },
    "deployment_config": {
      "image": "{ecr-url-from-upload-response}",
      "container_port": {container-port}
    }
  }'
```

**Check Status API Call:**
```bash
curl -X GET http://3.96.155.43:30000/api/v1/internal-tools/status/{app-key} \
  -H "Authorization: Bearer {api-token}"
```

**Response Processing:**
- **Upload Response**: Extract `data.ecr_url` from JSON (no port extraction needed)
- **Deploy Response**: Extract `data.app_key`, `data.name`, and `data.status` from JSON
- **Status Response**: Extract `data.status` and `data.access_url` (when ready) from JSON

**Example Response Handling:**
```bash
# Parse upload response
ECR_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.ecr_url')

# Parse deploy response
APP_KEY=$(echo "$DEPLOY_RESPONSE" | jq -r '.data.app_key')
APP_NAME=$(echo "$DEPLOY_RESPONSE" | jq -r '.data.name')
DEPLOY_STATUS=$(echo "$DEPLOY_RESPONSE" | jq -r '.data.status')

# Parse status response (when checking deployment progress)
STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')
ACCESS_URL=$(echo "$STATUS_RESPONSE" | jq -r '.data.access_url // empty')

# Final access URL (when status is "ready")
if [ "$STATUS" = "ready" ]; then
    FINAL_ACCESS_URL=$(echo "$STATUS_RESPONSE" | jq -r '.data.access_url')
    echo "🌐 Application ready: $FINAL_ACCESS_URL"
    echo "📋 Access format: https://tools.fangintel.com/username/app-key/"
fi
```

**Token Management:**
- Token format: `dt_abc123def456...`
- If no token provided, Claude will prompt user to input token
- Contact #devops-support or devops@housesigma.com for token access

**API Workflow Summary:**
1. **Validate app_key** - Must follow DNS-1123 label standard (lowercase, hyphens only, 1-63 chars)
2. Upload image with `app_key` parameter (not `app_name`)
3. Deploy using `app_key` in `app_info` (no `name` or `icon` fields needed)
4. Check status using `app_key` (not `deployment_id`)
5. Access via `https://tools.fangintel.com/username/app-key/` (new domain)
6. Delete using `app_key`: `DELETE /api/v1/internal-tools/apps/{app-key}`

### 6. **Cleanup**
- Remove temporary tar file
- Display deployment URL and status

**Platform Compatibility:**
- ✅ **Windows**: PowerShell/CMD with Docker Desktop
- ✅ **macOS**: Terminal with Docker
- ✅ **Linux**: Shell with Docker
- ✅ **WSL**: Linux commands within Windows

This command will:
- ✅ **Validate and normalize app name** to DNS-1123 label format (lowercase, hyphens, 1-63 chars)
- ✅ Auto-detect project type and generate appropriate Dockerfile (ONLY if none exists)
- ✅ **Auto-detect container port** from Dockerfile, package.json, or project structure
- ✅ Build Docker image with correct platform (linux/amd64 for ARM64)
- ✅ Save image as tar file
- ✅ Upload to internal-tools platform via API with authentication
- ✅ Deploy application with proper configuration using `app_key`
- ✅ Verify deployment status and provide access URL
- ✅ Clean up temporary files

**🔒 Code Safety Guarantees:**
- ❌ Will NOT modify any existing code files
- ❌ Will NOT overwrite existing Dockerfile
- ❌ Will NOT change package.json, requirements.txt, or any config files
- ✅ Will ONLY create new Dockerfile if one doesn't exist
- ✅ Will ask for confirmation before creating new files

**🌐 Cross-Platform Support:**
- ✅ **Windows 10/11** with Docker Desktop
- ✅ **macOS** (Intel/Apple Silicon) with Docker
- ✅ **Linux** distributions with Docker
- ✅ **WSL2** on Windows
- ✅ Automatic architecture detection and platform flags

**📋 Requirements:**
- Docker installed and running
- Internet connection for API calls
- `curl` available (pre-installed on most systems)
- Valid API access token (format: `dt_abc123...`)
- Contact #devops-support or devops@housesigma.com for token access

The deployment will be accessible via the provided URL once completed.
