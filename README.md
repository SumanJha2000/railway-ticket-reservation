Clone the Repository

git clone https://github.com/your-username/railway-ticket-reservation.git
cd railway-ticket-reservation

Install Dependencies

npm install

Set up the Database

Create a MySQL database:

CREATE DATABASE railway_db;
USE railway_db;

-- passengers table
CREATE TABLE passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  age INT,
  gender VARCHAR(10),
  has_child BOOLEAN,
  child_age INT,
  parent_id INT
);

-- tickets table
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT,
  status ENUM('confirmed', 'rac', 'waiting'),
  berth_preference VARCHAR(10)
);

-- berth_allocations table
CREATE TABLE berth_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT,
  berth_type VARCHAR(10),
  berth_number VARCHAR(10),
  allocated BOOLEAN
);

Configure Database Connection

In src/db.js, update your database credentials:

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'your-username',
  password: 'your-password',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

🚀 Running the Application

With Node:

npm start

With Docker:

Build Docker Image

docker build -t railway-booking-app .

Run the Container

docker run -p 3000:3000 railway-booking-app

📘 API Endpoints

1. Book Ticket

POST /api/tickets/book

Request Body:

{
  "name": "John Doe",
  "age": 35,
  "gender": "male",
  "berth_preference": "lower",
  "children": [
    { "name": "Kid1", "age": 3, "gender": "female" }
  ]
}

Response:

{
  "statusCode": 200,
  "status": "confirmed",
  "ticketId": 1,
  "message": "Ticket booked successfully (CONFIRMED)"
}

2. Get Available Seats

GET /api/seats/availability

Response:

{
  "statusCode": 200,
  "data": {
    "confirmed": 10,
    "rac": 3,
    "waiting": 1
  }
}

3. Cancel Ticket

DELETE /api/tickets/:id

Response:

{
  "statusCode": 200,
  "status": "cancelled",
  "message": "Ticket cancelled successfully.",
  "details": "RAC Ticket ID 5 promoted to CONFIRMED. Waiting Ticket ID 9 promoted to RAC."
}

4. Get All Booked Tickets

GET /api/tickets

Response:

{
  "statusCode": 200,
  "data": [
    {
      "ticket_id": 1,
      "name": "John Doe",
      "age": 35,
      "gender": "male",
      "status": "confirmed",
      "berth_type": "lower",
      "berth_number": "L1",
      "children": [
        { "name": "Kid1", "age": 3, "gender": "female" }
      ]
    }
  ]
}

