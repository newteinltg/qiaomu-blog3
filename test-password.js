const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Initialize SQLite database
const db = new Database('./blog.db');

async function testPassword() {
  const email = 'vista8@gmail.com';
  const password = 'qq778899';
  
  try {
    // Get the user from the database
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (!user) {
      console.log(`No user found with email ${email}`);
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      passwordHash: user.password.substring(0, 20) + '...'
    });
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid?', isPasswordValid);
    
  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the function
testPassword();
