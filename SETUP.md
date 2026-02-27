# Setup Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- Python 3.9+ (for attacker bot)
- Git

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd honeyglow-trap
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Check services are running**
   ```bash
   docker-compose ps
   ```

4. **Access the applications**
   - Frontend (Fake Store): http://localhost
   - Dashboard: http://localhost/dashboard
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

5. **View logs**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f dashboard
   ```

## Local Development Setup

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Start MongoDB** (if not using Docker)
   ```bash
   docker run -d -p 27017:27017 mongo:7
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access at**: http://localhost:5173

### Dashboard Setup

1. **Navigate to dashboard directory**
   ```bash
   cd dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access at**: http://localhost:5174

## Attacker Bot Setup

1. **Navigate to attacker-bot directory**
   ```bash
   cd attacker-bot
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run individual attacks**
   ```bash
   python brute_force.py
   python coupon_abuse.py
   python xss_injection.py
   python sqli_attack.py
   python price_tampering.py
   python privilege_escalation.py
   ```

4. **Run all attacks**
   ```bash
   python run_all.py
   ```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://admin:honeypot123@localhost:27017/honeyglow?authSource=admin
JWT_SECRET=super-secret-honeypot-jwt-key-change-in-production
GEOIP_API_KEY=
```

### Frontend
Set `VITE_API_URL` in `.env` file:
```
VITE_API_URL=http://localhost:3001
```

## Database Setup

MongoDB will be automatically initialized when using Docker Compose.

To manually initialize:
1. Connect to MongoDB
2. Create database: `honeyglow`
3. Collections will be created automatically on first use

## Troubleshooting

### Port Already in Use
If ports 80, 3001, 5173, or 5174 are in use:
- Change ports in `docker-compose.yml`
- Or stop conflicting services

### MongoDB Connection Issues
- Check MongoDB is running: `docker ps`
- Verify connection string in `.env`
- Check MongoDB logs: `docker-compose logs mongodb`

### Frontend Can't Connect to Backend
- Verify backend is running
- Check `VITE_API_URL` environment variable
- Check CORS settings in backend

### Dashboard Shows No Data
- Ensure backend is running
- Check MongoDB has attack logs
- Verify API endpoints are accessible

## Production Deployment

⚠️ **WARNING**: This is a honeypot with intentional vulnerabilities. Do NOT deploy to production without proper isolation.

For production-like deployment:
1. Use isolated network/VPC
2. Implement proper firewall rules
3. Use reverse proxy with SSL
4. Set up monitoring and alerting
5. Regular backups of attack logs
6. Implement rate limiting
7. Use environment-specific configurations

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Resetting the Honeypot

To reset all data:
```bash
docker-compose down -v
docker-compose up -d
```

This will remove all attack logs and reset the database.
