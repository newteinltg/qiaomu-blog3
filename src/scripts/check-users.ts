import { db } from '@/lib/db';
import * as schema from '@/lib/schema';

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    // Query all users
    const users = await db.select().from(schema.users).all();
    
    console.log(`Found ${users.length} users:`);
    
    // Display user info (excluding full password hash)
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password ? '********' + user.password.substring(user.password.length - 5) : 'No password'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('---');
    });
    
    if (users.length === 0) {
      console.log('No users found in the database. You may need to create a user first.');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
checkUsers();
