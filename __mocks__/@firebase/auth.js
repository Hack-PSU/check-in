// __mocks__/@firebase/auth.js
export const getAuth = jest.fn(() => ({
  currentUser: {
    getIdToken: jest.fn(() => Promise.resolve('fake-id-token')),
  },
  onAuthStateChanged: jest.fn(() => jest.fn()), // Returns an unsubscribe function
  // onIdTokenChanged is NOT part of the auth object, it's a top level export
}));

export const onIdTokenChanged = jest.fn(() => jest.fn()); // Returns an unsubscribe function
export const getIdToken = jest.fn((user) => Promise.resolve('fake-id-token-from-getidtoken'));


// You can add mocks for other functions from 'firebase/auth' if they are used
// For example:
// export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: { uid: 'fake-uid' } }));
// export const signOut = jest.fn(() => Promise.resolve());
// export const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: { uid: 'fake-uid' } }));

// If the code imports specific errors or types, you might need to mock them too
// export const AuthErrorCodes = { INVALID_EMAIL: 'auth/invalid-email' };
