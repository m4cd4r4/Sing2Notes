FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --only=production

COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Set appropriate permissions
RUN chmod -R 775 ./uploads

EXPOSE 5000

CMD ["npm", "start"]