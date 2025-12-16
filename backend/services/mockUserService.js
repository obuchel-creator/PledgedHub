/**
 * Mock User Service for OAuth testing without database
 * This allows OAuth to work even when database is not available
 */

// In-memory user store for testing
const users = new Map();
let userIdCounter = 1;

class MockUserService {
    static async findOne({ email }) {
        for (const [id, user] of users) {
            if (user.email === email) {
                return { id, ...user };
            }
        }
        return null;
    }

    static async create(userData) {
        const id = userIdCounter++;
        const user = {
            email: userData.email,
            name: userData.name || '',
            oauthProvider: userData.oauthProvider,
            oauthId: userData.oauthId,
            emailVerified: userData.emailVerified || false,
            createdAt: new Date()
        };
        
        users.set(id, user);
        console.log(`📝 Mock user created: ${user.email} (ID: ${id})`);
        
        return { id, ...user };
    }

    static async getById(id) {
        const user = users.get(parseInt(id));
        return user ? { id, ...user } : null;
    }

    static getAll() {
        const allUsers = [];
        for (const [id, user] of users) {
            allUsers.push({ id, ...user });
        }
        return allUsers;
    }

    static clear() {
        users.clear();
        userIdCounter = 1;
    }
}

module.exports = MockUserService;