# Kindling Project

Kindling is a full-stack web application designed to simulate real-time visitor activity tracking on a website. Built with React (Vite) for the frontend and NestJS (Node.js + TypeScript) for the backend, the application captures session events and enriches them with user information in real-time.

### Project Structure

The repository contains two distinct directories:

* /frontend - React.js UI built with Vite.

* /backend - API service built with NestJS.

For further instructions regarding each project, take a look at the respective `README.md` file.

Notice that both projects contain example `.env` files in their root folder.

### Project Details

* Real-time updates: Frontend connects to the backend via WebSocket (socket.io) and listens for the session_changed event for granular control of each session.

* Initial Load: Frontend fetches initial session data through HTTP from the backend.

* Data Caching: Backend uses node-cache to efficiently manage session data and reduce external API requests.

* Session Cleanup: Idle sessions are automatically cleaned up based on TTL configuration.
