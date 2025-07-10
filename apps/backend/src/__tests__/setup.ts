import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Add any global test setup here
});

afterAll(async () => {
  // Add any global test cleanup here
});
