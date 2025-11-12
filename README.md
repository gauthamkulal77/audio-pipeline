**Real-Time Audio Ingestion Pipeline**

A proof-of-concept web application that builds and verifies a complete, real-time audio ingestion pipeline.

This application captures live audio from a user's microphone, processes it into chunks, and streams it to a Redis database. It features a live-updating 
UI that displays the processed chunks and then immediately deletes them from the database to efficiently manage storage.



**🚀 Key Features**

Audio Capture: The client-side index.html file uses the browser's MediaRecorder API to capture 2-second audio chunks from the user's microphone.

Real-Time Transport: Audio chunks are Base64 encoded and sent to a Node.js backend over a persistent WebSocket (ws) connection.

Backend Service: The server.js (Express) file listens for WebSocket messages and ingests the audio chunks into a Redis Stream using the XADD command.

Storage Management (Read-and-Delete):

The UI includes a live data feed that automatically polls the server every 10 seconds to fetch new audio chunks.

New chunks are appended to a growing log on the webpage for verification.

Immediately after displaying the chunks, the UI sends a command back to the server to permanently delete those chunks from the Redis database (using XDEL).

This "read-and-delete" pattern ensures the free 30MB storage limit on Redis Cloud is never exceeded.


**🛠️ Tech Stack**

Client: HTML, CSS, JavaScript (Fetch API, WebSockets)

Backend: Node.js, Express

Real-Time: ws (WebSocket) library

Database: Redis (using Redis Streams)

**🏁 How to Run**


**1. Clone the repository:**

Bash

git clone https://github.com/gauthamkulal77/audio-pipeline.git
cd audio-pipeline

**2. Install dependencies:**

Bash

npm install

**3. Set up your environment:**

Create a free Redis Cloud database.

Rename the .env.example file (if you have one) to .env.

Add your Redis Cloud URL and password to the .env file:

Code snippet

REDIS_URL="redis://default:YOUR_PASSWORD@YOUR_REDIS_ENDPOINT_URL"
PORT=8081

**4. Run the server:**

Bash

node server.js


**5. Open the application:**

Open your browser and go to http://localhost:8081 (or the port you specified).

Click "Start Recording" to begin the pipeline.
