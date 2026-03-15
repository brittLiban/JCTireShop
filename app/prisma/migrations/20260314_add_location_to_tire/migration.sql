-- Add location field to Tire
ALTER TABLE "Tire" ADD COLUMN "location" TEXT;

-- Add composite index for size search
CREATE INDEX "Tire_width_aspect_diameter_idx" ON "Tire"("width", "aspect", "diameter");
