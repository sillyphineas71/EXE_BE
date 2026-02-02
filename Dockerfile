FROM node:20-alpine

# Timezone database (Alpine mặc định không có tzdata)
RUN apk add --no-cache tzdata

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production

# Nếu bạn chạy cron theo giờ VN, set TZ để log/date đúng và một số lib đọc TZ
ENV TZ=Asia/Ho_Chi_Minh

CMD ["node", "worker.js"]
