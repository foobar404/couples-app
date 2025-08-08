// Development test accounts configuration
export const DEV_CONFIG = {
  // Enable test mode in development
  IS_DEV: import.meta.env.DEV,
  
  // Test user accounts for development
  TEST_USERS: {
    user1: {
      uid: 'test-user-1',
      email: 'test.user@example.com',
      name: 'Alex (Test User)',
      displayName: 'Honey Bear',
      imageUrl: 'https://via.placeholder.com/150/e91e63/ffffff?text=A',
    },
    user2: {
      uid: 'test-user-2', 
      email: 'test.partner@example.com',
      name: 'Jordan (Test Partner)',
      displayName: 'Sunshine',
      imageUrl: 'https://via.placeholder.com/150/9c27b0/ffffff?text=J',
    }
  }
};

// Mock Firebase functions for development
export const mockSignInAsUser1 = () => {
  return Promise.resolve(DEV_CONFIG.TEST_USERS.user1);
};

export const mockSignInAsUser2 = () => {
  return Promise.resolve(DEV_CONFIG.TEST_USERS.user2);
};

export const getTestUserData = (emailOrType) => {
  // Handle user type strings
  if (emailOrType === 'user') {
    return {
      user: DEV_CONFIG.TEST_USERS.user1
    };
  } else if (emailOrType === 'partner') {
    return {
      user: DEV_CONFIG.TEST_USERS.user2
    };
  }
  
  // Handle actual email addresses
  if (emailOrType === 'test.user@example.com') {
    return {
      user: DEV_CONFIG.TEST_USERS.user1
    };
  } else if (emailOrType === 'test.partner@example.com') {
    return {
      user: DEV_CONFIG.TEST_USERS.user2
    };
  }
  
  return null;
};
