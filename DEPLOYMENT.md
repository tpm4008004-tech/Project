# Project Tracker - Deployment Guide

This is the production-ready copy of the app.
The original development copy remains untouched at: d:\chai kaapi\project-tracker

---

## What is Different in This Copy

| Feature              | Dev Copy          | This Prod Copy                   |
|----------------------|-------------------|----------------------------------|
| Password storage     | Plain text        | bcrypt hashed (auto-upgrades)    |
| Next.js config       | Dev origins/HMR   | Clean, no dev-only settings      |
| Start command        | npm run dev       | npm run build then npm start     |

---

## Option 1 - VPS / Cloud Server (Recommended)
### DigitalOcean, Linode, Hetzner, AWS EC2 (Ubuntu/Debian)

1. Buy a VPS - minimum 1 GB RAM. DigitalOcean at 6 dollars/month is enough.
   Choose Ubuntu 22.04 LTS as the OS.

2. Connect via SSH:
   ssh root@YOUR_SERVER_IP

3. Install Node.js v20:
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

4. Install PM2 (process manager):
   npm install -g pm2

5. Upload the project from your Windows PC:
   scp -r "d:\project-tracker-prod" root@YOUR_SERVER_IP:/var/www/project-tracker
   (Or use FileZilla SFTP to drag and drop the folder)

6. On the server - install, build, start:
   cd /var/www/project-tracker
   npm install
   npm run build
   pm2 start npm --name project-tracker -- start
   pm2 save
   pm2 startup  (run the command it prints)

7. Set up Nginx reverse proxy:
   sudo apt install -y nginx
   sudo nano /etc/nginx/sites-available/project-tracker

   Paste this config (replace yourdomain.com with your domain or server IP):

   server {
       listen 80;
       server_name yourdomain.com;
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade http_upgrade;
           proxy_set_header Connection upgrade;
           proxy_set_header Host host;
       }
   }

   sudo ln -s /etc/nginx/sites-available/project-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx

8. Enable free HTTPS with Let's Encrypt:
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com

   App is now live at: https://yourdomain.com

---

## Option 2 - Self-Host on a Dedicated PC or NAS

1. Install Node.js v20 LTS from nodejs.org on the host machine

2. Copy the project-tracker-prod folder to the host machine

3. Open a terminal in the project folder and run:
   npm install
   npm run build
   npm start

4. Keep it running with PM2 (Windows):
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2 start npm --name project-tracker -- start
   pm2 save
   pm2-windows-startup install

5. Any device on the same network can open:
   http://HOST_PC_IP:3000

---

## Option 3 - Vercel or Render (FREE HOSTING)

This application has been upgraded to use **MongoDB** instead of local JSON files, which makes it fully compatible with serverless hosting platforms like Vercel and Render.

### Prerequisites
1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free Cluster and get your **Connection String**.

### Deploying to Vercel
1. Push this repository to GitHub.
2. Sign up on [Vercel](https://vercel.com/) and create a New Project from your GitHub repository.
3. In the Environment Variables section, add:
   - Key: `MONGODB_URI`
   - Value: `your_mongodb_connection_string_here`
4. Deploy!

### Note on First Login
If your MongoDB database is completely empty, the application will automatically create the default `admin` user with the password `admin123` upon your first attempt to login.
---

## Updating the App After Code Changes

1. Copy updated files from:
      d:\chai kaapi\project-tracker\src
   to:
      d:\project-tracker-prod\src

2. Upload updated files to the server

3. On the server run:
   cd /var/www/project-tracker
   npm run build
   pm2 restart project-tracker

---

## Data Backup

All data is stored securely in your MongoDB database under the `project_tracker` database.
There are three collections:
- `users`
- `projects`
- `template`

You can back up your data at any time by exporting these collections from the MongoDB Atlas dashboard or using MongoDB Compass.

---

## Default Login Credentials - CHANGE THESE IMMEDIATELY

Username    | Default Password   | Role
------------|--------------------|---------------------
admin       | admin123           | CEO (full access)
ceo         | ceo123             | CEO
cpo         | cpo123             | CPO
po          | po123              | PO
architect   | arch123            | Architect
franchise   | franchise123       | Franchise Owner

Passwords are automatically hashed with bcrypt on the first login.

---

## Firewall Rules (VPS only)

sudo ufw allow 22     (SSH)
sudo ufw allow 80     (HTTP)
sudo ufw allow 443    (HTTPS)
sudo ufw enable

Port 3000 does NOT need to be public - Nginx handles routing.