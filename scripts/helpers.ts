// This file contains helper utilities for development
import fs from 'fs';
import path from 'path';

// Generate API types from backend DTOs
export function generateApiTypes() {
  console.log('Generating API types from backend DTOs...');
  // This would automatically generate TypeScript types from NestJS DTOs
}

// Database seed helper
export async function seedDatabase() {
  console.log('Seeding database with sample data...');
  // This would populate the database with sample restaurants, items, etc.
}

export default {
  generateApiTypes,
  seedDatabase,
};
