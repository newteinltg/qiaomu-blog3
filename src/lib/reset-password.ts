import { db } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

/**
 * This script resets the password for a specific user
 * Run with: npx ts-node src/lib/reset-password.ts
 */
async function resetPassword() {
  const email = 'vista8@gmail.com'; // The email of the user to reset
  const newPassword = 'admin123'; // The new password to set
  
  try {
    // Update the user's password
    await db
      .update(schema.users)
      .set({ password: newPassword })
      .where(eq(schema.users.email, email));
    
    console.log(`Password reset successful for ${email}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

// Run the function
resetPassword();
