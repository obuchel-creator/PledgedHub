// Quick route test to check if OAuth endpoints exist
const express = require('express');
const app = express();

// Import routes
const oauthRoutes = require('./routes/oauthRoutes');

// Mount OAuth routes
app.use('/api/auth', oauthRoutes);

// List all routes
function listRoutes() {
    console.log('🔍 OAuth Routes Check\n');
    
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(middleware.route);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                const route = handler.route;
                if (route) {
                    const method = Object.keys(route.methods)[0].toUpperCase();
                    const path = '/api/auth' + route.path;
                    routes.push({ method, path });
                }
            });
        }
    });

    if (routes.length > 0) {
        console.log('Available OAuth Routes:');
        routes.forEach(route => {
            console.log(`  ${route.method || 'GET'} ${route.path || route.path}`);
        });
    } else {
        console.log('❌ No OAuth routes found');
    }
}

listRoutes();