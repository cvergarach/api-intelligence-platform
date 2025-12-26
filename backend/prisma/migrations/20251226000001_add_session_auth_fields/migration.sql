-- AlterTable
ALTER TABLE "Api" ADD COLUMN "authEndpoint" TEXT,
ADD COLUMN "authMethod" TEXT,
ADD COLUMN "authPayload" JSONB,
ADD COLUMN "tokenPath" TEXT,
ADD COLUMN "tokenHeaderName" TEXT;
