import { db } from '../lib/db';
import * as schema from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

/**
 * This script updates a user's password with proper bcrypt hashing
 * Run with: npx ts-node src/scripts/update-password.ts
 */
async function updatePassword() {
  const email = 'vista8@gmail.com'; // The email of the user
  const newPassword = 'qq778899'; // The new password to set
  
  try {
    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password in the database
    await db
      .update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.email, email));
    
    console.log(`Password updated successfully for ${email}`);
    console.log('You can now log in with your new password');
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

// Run the function
updatePassword();
