const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Initialize SQLite database
const db = new Database('./blog.db');

async function updatePassword() {
  const email = 'vista8@gmail.com';
  const password = 'qq778899';
  
  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update the user's password in the database
    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
    const result = updateStmt.run(hashedPassword, email);
    
    if (result.changes > 0) {
      console.log(`Password updated successfully for ${email}`);
      console.log('You can now log in with your new encrypted password');
    } else {
      console.log(`No user found with email ${email}`);
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the function
updatePassword();
